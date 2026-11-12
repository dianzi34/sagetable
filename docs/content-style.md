# SageTable Content Style Guide

Old public-domain writing is dense and hard to skim. SageTable exists to make wisdom from historical figures clear, vivid, and immediately readable while grounding every answer in real history and verbatim primary-source passages.

## Answer `body` Rules

- **Length:** `60-100` words and `3-5` sentences.
- **Direct opening:** The first sentence answers the user's question directly.
- **Plain modern English:** Write at roughly a grade 7 reading level using short, natural sentences, zero archaic phrasing, and no academic or technical jargon.
- **Second person:** Speak directly to the reader as `"you"`.
- **Concrete structure:** Pair **one concrete true story** from the figure's real life with **one practical takeaway**. No lectures and no bulleted lists.
- **Personality & light humor:**
  - **Mark Twain:** witty, self-deprecating, observant.
  - **Helen Keller:** warm, determined, hopeful.
  - **Marie Curie:** calm, steady, practical.
  - **Vincent van Gogh:** earnest, passionate, honest.
  - **Leonardo da Vinci:** endlessly curious, observant, hands-on.
- **Strict factual & quote discipline:**
  - Never state biographical facts that are not true of the figure's life.
  - Never put quotation marks around any phrase unless those exact words appear in one of that answer's linked passages.

### Target Style Example (Mark Twain — Choosing a Career)

> Honestly, I didn't get my career right on the first try. I was a printer, then a riverboat pilot, then a pretty bad silver miner, and only after all that did I start writing. Piloting taught me one thing, though: you learn a river one bend at a time. So don't wait to choose perfectly. Pick something, notice what you love about it, and steer from there.

## Passage Rules

- **Strictly verbatim & contiguous:** Every passage `text` must match a single contiguous slice of the downloaded pre-1929 source text (whitespace normalized only; never edit or paraphrase words).
- **Length:** `30-90` words (trimmed cleanly to the most relevant sentences).
- **Count per answer:** `1-2` passages per answer; prefer `1` strong passage when it carries the answer well.
- **Location:** Provide a human-readable reference (chapter, notebook number, or letter extract/date).

## Passage `explanation` Rules

- **Length:** At most `2` sentences and at most `35` words.
- **Content:** Plainly state what the passage means and how it applies to the reader today.

## Search & Discovery Metadata

- **`themes.json`:** Every theme includes `suggestedFigures` (`2-3` slugs) and `suggestedQuestions` (`2-3` concise student-friendly questions).
- **`topicKeywords`:** `6-12` lowercase single words (`^[a-z]+$`) per answer, always including the key content words from the theme's `suggestedQuestions` so full-text search matches reliably.
