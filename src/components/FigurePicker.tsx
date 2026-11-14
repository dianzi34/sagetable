import type { CSSProperties, ReactElement } from "react";
import { FigureAvatar } from "@/components/FigureAvatar";
import { getFigureAccent } from "@/lib/figures";
import type { CatalogFigure } from "@/types/catalog";

export interface FigurePickerProps {
  figures: CatalogFigure[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  min?: number;
  max?: number;
}

export function FigurePicker({
  figures,
  selectedIds,
  onToggle,
  min = 2,
  max = 3,
}: FigurePickerProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="font-display font-semibold text-base text-ink">
          Choose {min}–{max} figures
        </label>
        <span className="text-xs text-muted">
          {selectedIds.length} of {max} selected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {figures.map((figure) => {
          const isSelected = selectedIds.includes(figure.id);
          const accent = getFigureAccent(figure.slug);

          return (
            <button
              key={figure.id}
              type="button"
              onClick={() => onToggle(figure.id)}
              aria-pressed={isSelected}
              style={{ "--figure-accent": accent } as CSSProperties}
              className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-3 bg-paper cursor-pointer relative ${
                isSelected
                  ? "border-[var(--figure-accent)] ring-2 ring-[var(--figure-accent)]/20 shadow-md"
                  : "border-line hover:border-muted/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FigureAvatar
                    slug={figure.slug}
                    name={figure.name}
                    size={48}
                    accentColor={accent}
                  />
                  <div>
                    <h3 className="font-display font-semibold text-base text-ink leading-tight">
                      {figure.name}
                    </h3>
                    <p className="text-xs text-muted">
                      {figure.field} · {figure.era}
                    </p>
                  </div>
                </div>

                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-colors ${
                    isSelected
                      ? "bg-[var(--figure-accent)] border-[var(--figure-accent)] text-action-ink"
                      : "border-muted/40 bg-transparent"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected ? "✓" : ""}
                </span>
              </div>

              <p className="text-xs text-ink/80 leading-relaxed line-clamp-3">
                {figure.bio}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
