import { Figure, Passage, AnswerCardProps } from "@/types";

export const MOCK_FIGURES: Record<string, Figure> = {
  twain: {
    id: "twain",
    name: "Mark Twain",
    meta: "Writer, United States, 1835–1910",
    accentColor: "#2f6f5e",
    avatarId: "twain",
  },
  keller: {
    id: "keller",
    name: "Helen Keller",
    meta: "Author and activist, United States, 1880–1968",
    accentColor: "#7d4a92",
    avatarId: "keller",
  },
  curie: {
    id: "curie",
    name: "Marie Curie",
    meta: "Physicist and chemist, Poland and France, 1867–1934",
    accentColor: "#2a64a8",
    avatarId: "curie",
  },
};

export const MOCK_PASSAGES: Record<string, Passage> = {
  twain: {
    text: "Courage is resistance to fear, mastery of fear—not absence of fear.",
    source: "Pudd’nhead Wilson, 1894, Chapter 12",
    sourceTitle: "Pudd’nhead Wilson",
    year: 1894,
    location: "Chapter 12",
  },
  keller: {
    text: "Although the world is full of suffering, it is full also of the overcoming of it.",
    source: "Optimism: An Essay, 1903, Part I",
    sourceTitle: "Optimism: An Essay",
    year: 1903,
    location: "Part I",
  },
};

export const MOCK_ANSWERS: Record<string, string> = {
  twain:
    "Fear of a second try is natural. I knew it well. I set type, piloted riverboats, and sank a small fortune into a typesetting machine that never worked. Being afraid isn’t the problem. Letting the fear choose for you is.",
  keller:
    "When I was a child, every word I learned came after many failed attempts at my teacher’s hand. I came to believe that struggle and progress travel together. One failed interview shows you where the work is. It does not tell you who you are.",
  curie:
    "When Pierre and I began, our laboratory was a leaking shed, and for months our results told us nothing. I learned to read each failed attempt as a measurement, not a verdict.",
};

export const MOCK_EXPLANATIONS: Record<string, string> = {
  twain:
    "Being brave doesn’t mean you stop feeling scared. It means you act while you’re still scared.",
  keller:
    "Hard things happen everywhere, but so do people getting past them. Your setback is part of a story that can still turn.",
};

export const MOCK_ROUNDTABLE_CARDS: AnswerCardProps[] = [
  {
    figure: MOCK_FIGURES.twain,
    status: "complete",
    answer: MOCK_ANSWERS.twain,
    passage: MOCK_PASSAGES.twain,
    explanation: MOCK_EXPLANATIONS.twain,
  },
  {
    figure: MOCK_FIGURES.keller,
    status: "complete",
    answer: MOCK_ANSWERS.keller,
    passage: MOCK_PASSAGES.keller,
    explanation: MOCK_EXPLANATIONS.keller,
  },
  {
    figure: MOCK_FIGURES.curie,
    status: "complete",
    answer: MOCK_ANSWERS.curie,
    passage: null,
    explanation: null,
  },
];
