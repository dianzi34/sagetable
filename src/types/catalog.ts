export interface CatalogFigure {
  id: string;
  slug: string;
  name: string;
  field: string;
  era: string;
  bio: string;
  avatarKey: string;
}

export interface CatalogThemeSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  suggestedQuestions: string[];
}

export interface CatalogThemeDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  suggestedQuestions: string[];
  suggestedFigures: CatalogFigure[];
  availableFigures: CatalogFigure[];
  figures: CatalogFigure[];
  theme: CatalogThemeSummary;
}
