export interface RoundtableFigure {
  slug: string;
  name: string;
  field: string;
  era: string;
}

export interface AnswerPassageItem {
  text: string;
  workTitle: string;
  workYear: number;
  location: string;
  explanation: string;
}

export interface MatchedAnswer {
  body: string;
  passages: AnswerPassageItem[];
}

export interface AnswerCardData {
  figure: RoundtableFigure;
  answer: MatchedAnswer | null;
}
