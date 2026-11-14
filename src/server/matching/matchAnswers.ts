import "server-only";
import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db";
import type { AnswerPassageItem, MatchedAnswer } from "@/types/roundtable";

/**
 * Minimum combined full-text relevance score required to surface a curated answer.
 */
export const MATCH_THRESHOLD = 0.15;

const MAX_QUERY_TOKENS = 32;
const MAX_PASSAGES_PER_ANSWER = 2;
const IRREGULAR_CONTRACTION_REGEX = /\b(can|won|shan)['\u2019]t\b/gi;
const CONTRACTION_SUFFIX_REGEX = /['\u2019](?:s|m|re|ve|ll|d)\b|n['\u2019]t\b/gi;
const SEARCH_TOKEN_REGEX = /[a-z0-9]+/g;

const IRREGULAR_CONTRACTION_MAP: Record<string, string> = {
  can: "can",
  won: "will",
  shan: "shall",
};

// Mirrors common PostgreSQL English stopwords so stopword-only inputs skip DB queries.
const ENGLISH_STOPWORDS = new Set([
  "about",
  "after",
  "all",
  "also",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "between",
  "both",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "doing",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "just",
  "me",
  "more",
  "most",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "now",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "she",
  "should",
  "so",
  "some",
  "such",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "will",
  "with",
  "would",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
]);

const matchAnswersInputSchema = z.object({
  question: z.string(),
  figureIds: z.array(z.string().trim().min(1)),
  themeId: z.string().nullish(),
});

export interface MatchAnswersInput {
  question: string;
  figureIds: string[];
  themeId?: string | null;
}

export interface MatchedAnswerPayload extends MatchedAnswer {
  id: string;
  themeId: string;
}

export interface FigureAnswerMatch {
  figureId: string;
  answer: MatchedAnswerPayload | null;
  score: number;
}

interface RankedAnswerRow {
  id: string;
  figureId: string;
  themeId: string;
  body: string;
  score: number;
}

function dedupeIds(figureIds: readonly string[]): string[] {
  return Array.from(new Set(figureIds));
}

function extractSearchTerms(question: string): string[] {
  const normalized = question
    .replace(
      IRREGULAR_CONTRACTION_REGEX,
      (_match, base: string) =>
        IRREGULAR_CONTRACTION_MAP[base.toLowerCase()] ?? base,
    )
    .replace(CONTRACTION_SUFFIX_REGEX, "")
    .toLowerCase();
  const tokens = normalized.match(SEARCH_TOKEN_REGEX) ?? [];
  const unique = new Set<string>();

  for (const token of tokens) {
    if (token.length < 2 || ENGLISH_STOPWORDS.has(token)) {
      continue;
    }
    unique.add(token);
    if (unique.size >= MAX_QUERY_TOKENS) {
      break;
    }
  }

  return Array.from(unique);
}

async function queryBestRankedAnswers(
  db: PrismaClient,
  figureIds: readonly string[],
  terms: readonly string[],
  themeId: string | null,
): Promise<Map<string, RankedAnswerRow>> {
  const rows = await db.$queryRaw<RankedAnswerRow[]>(Prisma.sql`
    WITH valid_tokens AS (
      SELECT DISTINCT token
      FROM unnest(${Array.from(terms)}::text[]) AS token
      WHERE numnode(plainto_tsquery('english', token)) > 0
    ),
    term_stats AS (
      SELECT
        COUNT(*)::int AS term_count,
        to_tsquery('english', string_agg(token, ' | ')) AS combined_query
      FROM valid_tokens
    ),
    candidates AS (
      SELECT
        a.id,
        a."figureId",
        a."themeId",
        a.body,
        ts_rank(a."searchVector", ts.combined_query, 1)::float8 AS answer_rank,
        COALESCE(
          (
            SELECT MAX(ts_rank(p."searchVector", ts.combined_query, 1))::float8
            FROM "AnswerPassage" ap
            INNER JOIN "Passage" p ON p.id = ap."passageId"
            WHERE ap."answerId" = a.id
              AND p."searchVector" @@ ts.combined_query
          ),
          0
        ) AS passage_rank,
        (
          SELECT COUNT(*)::int
          FROM valid_tokens vt
          WHERE to_tsvector('english', a."topicKeywords") @@ plainto_tsquery('english', vt.token)
        ) AS matched_keyword_terms,
        (
          SELECT COUNT(*)::int
          FROM valid_tokens vt
          WHERE a."searchVector" @@ plainto_tsquery('english', vt.token)
            OR EXISTS (
              SELECT 1
              FROM "AnswerPassage" ap2
              INNER JOIN "Passage" p2 ON p2.id = ap2."passageId"
              WHERE ap2."answerId" = a.id
                AND p2."searchVector" @@ plainto_tsquery('english', vt.token)
            )
        ) AS matched_terms,
        ts.term_count,
        CASE
          WHEN ${themeId}::text IS NOT NULL AND a."themeId" = ${themeId}::text THEN 1.5::float8
          ELSE 1.0::float8
        END AS theme_boost,
        CASE
          WHEN ${themeId}::text IS NOT NULL AND a."themeId" = ${themeId}::text THEN 1
          ELSE 0
        END AS theme_match
      FROM "Answer" a
      CROSS JOIN term_stats ts
      WHERE ts.term_count > 0
        AND a."figureId" = ANY(${Array.from(figureIds)}::text[])
        AND EXISTS (
          SELECT 1
          FROM "AnswerPassage" ap_req
          WHERE ap_req."answerId" = a.id
        )
        AND (
          a."searchVector" @@ ts.combined_query
          OR EXISTS (
            SELECT 1
            FROM "AnswerPassage" ap_hit
            INNER JOIN "Passage" p_hit ON p_hit.id = ap_hit."passageId"
            WHERE ap_hit."answerId" = a.id
              AND p_hit."searchVector" @@ ts.combined_query
          )
        )
    )
    SELECT DISTINCT ON ("figureId")
      id,
      "figureId",
      "themeId",
      body,
      (
        (
          answer_rank * 5.0
          + passage_rank * 12.0
          + LEAST(matched_keyword_terms::float8 / LEAST(GREATEST(term_count, 1), 3), 1.0) * 0.45
        )
        * (0.15 + 0.85 * (matched_terms::float8 / GREATEST(term_count, 1)))
        * theme_boost
      )::float8 AS score
    FROM candidates
    ORDER BY
      "figureId",
      score DESC,
      theme_match DESC,
      id ASC
  `);

  const byFigureId = new Map<string, RankedAnswerRow>();
  for (const row of rows) {
    const numericScore = Number(row.score);
    const existing = byFigureId.get(row.figureId);
    if (!existing || numericScore > existing.score) {
      byFigureId.set(row.figureId, {
        ...row,
        score: numericScore,
      });
    }
  }

  return byFigureId;
}

async function loadPassagesByAnswerId(
  db: PrismaClient,
  answerIds: readonly string[],
): Promise<Map<string, AnswerPassageItem[]>> {
  const rows = await db.answerPassage.findMany({
    where: { answerId: { in: Array.from(answerIds) } },
    orderBy: [{ order: "asc" }, { passageId: "asc" }],
    include: {
      passage: {
        select: {
          text: true,
          location: true,
          work: {
            select: {
              title: true,
              year: true,
            },
          },
        },
      },
    },
  });

  const grouped = new Map<string, AnswerPassageItem[]>();
  for (const row of rows) {
    const list = grouped.get(row.answerId) ?? [];
    if (list.length >= MAX_PASSAGES_PER_ANSWER) {
      continue;
    }
    list.push({
      text: row.passage.text,
      workTitle: row.passage.work.title,
      workYear: row.passage.work.year,
      location: row.passage.location,
      explanation: row.explanation,
    });
    grouped.set(row.answerId, list);
  }

  return grouped;
}

/**
 * Match a user's question to each selected figure's highest-ranked curated answer
 * using PostgreSQL full-text search ranking and optional theme boosting.
 */
export async function matchAnswers(
  input: MatchAnswersInput,
  db: PrismaClient = prisma,
): Promise<FigureAnswerMatch[]> {
  const parsed = matchAnswersInputSchema.parse(input);
  const figureIds = dedupeIds(parsed.figureIds);

  if (figureIds.length === 0) {
    return [];
  }

  const terms = extractSearchTerms(parsed.question);
  if (terms.length === 0) {
    return figureIds.map((figureId) => ({
      figureId,
      answer: null,
      score: 0,
    }));
  }

  const normalizedThemeId = parsed.themeId?.trim() || null;
  const bestByFigure = await queryBestRankedAnswers(
    db,
    figureIds,
    terms,
    normalizedThemeId,
  );

  const qualifyingAnswerIds = Array.from(bestByFigure.values())
    .filter((row) => row.score >= MATCH_THRESHOLD)
    .map((row) => row.id);

  if (qualifyingAnswerIds.length === 0) {
    return figureIds.map((figureId) => ({
      figureId,
      answer: null,
      score: bestByFigure.get(figureId)?.score ?? 0,
    }));
  }

  const passagesByAnswerId = await loadPassagesByAnswerId(db, qualifyingAnswerIds);

  return figureIds.map((figureId) => {
    const candidate = bestByFigure.get(figureId);
    if (!candidate || candidate.score < MATCH_THRESHOLD) {
      return {
        figureId,
        answer: null,
        score: candidate?.score ?? 0,
      };
    }

    const passages = passagesByAnswerId.get(candidate.id) ?? [];
    if (passages.length === 0) {
      return {
        figureId,
        answer: null,
        score: candidate.score,
      };
    }

    return {
      figureId,
      score: candidate.score,
      answer: {
        id: candidate.id,
        themeId: candidate.themeId,
        body: candidate.body,
        passages,
      },
    };
  });
}
