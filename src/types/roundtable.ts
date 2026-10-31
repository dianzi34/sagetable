export interface Figure {
  id: string;
  name: string;
  meta: string;
  accentColor: string;
  avatarId?: "twain" | "keller" | "curie" | string;
  pronoun?: "his" | "her" | "their";
}

export interface Passage {
  text: string;
  source: string;
  sourceTitle?: string;
  year?: string | number;
  location?: string;
}

export type AnswerCardStatus = "streaming" | "complete" | "failed" | "noPassage";

export interface AnswerCardProps {
  figure: Figure;
  status?: AnswerCardStatus;
  answer: string;
  passage?: Passage | null;
  explanation?: string | null;
  onRetry?: () => void;
  onFlag?: () => void;
  isFlagged?: boolean;
}
