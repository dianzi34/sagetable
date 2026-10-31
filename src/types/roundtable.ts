export interface HistoricalFigure {
  id: string;
  name: string;
  title: string;
  era: string;
  avatarUrl?: string;
  initials: string;
  tradition: string; // e.g. "Stoicism", "Eastern Philosophy", "Mathematics & Computing", "Transcendentalism"
  accentColor?: string;
}

export interface PassageSource {
  work: string;               // e.g. "Meditations"
  section?: string;            // e.g. "Book IV, Section 3"
  year?: string;               // e.g. "c. 170–180 CE"
  translator?: string;         // e.g. "Translated by George Long"
  publicDomainNote?: string;   // e.g. "Public Domain (1862 translation)"
  sourceUrl?: string;
}

export interface OriginalPassage {
  text: string;
  source: PassageSource;
  originalLanguage?: string;   // e.g. "Koine Greek", "Classical Chinese"
  context?: string;            // brief historical background of the passage
}

export interface PlainEnglishExplanation {
  summary: string;             // Quick 1-2 sentence core insight in plain modern terms
  breakdown: string[];         // Key points unpacking the metaphors or archaic phrasing
  actionableTakeaway?: string; // How to apply this to real life today
}

export interface RoundtableAnswer {
  id: string;
  questionId: string;
  question: string;
  figure: HistoricalFigure;
  directAnswer: string;
  passage: OriginalPassage;
  explanation: PlainEnglishExplanation;
  tags: string[];
}
