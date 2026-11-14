"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";
import { FigurePicker } from "@/components/FigurePicker";
import { roundtableInputSchema } from "@/lib/roundtableInput";
import type { CatalogFigure } from "@/types/catalog";

export interface RoundtableQuestionFormProps {
  themeSlug: string;
  suggestedQuestions: string[];
  availableFigures: CatalogFigure[];
  initialSelectedFigureIds: string[];
}

export function RoundtableQuestionForm({
  themeSlug,
  suggestedQuestions,
  availableFigures,
  initialSelectedFigureIds,
}: RoundtableQuestionFormProps): ReactElement {
  const router = useRouter();
  const [selectedFigureIds, setSelectedFigureIds] = useState<string[]>(
    initialSelectedFigureIds,
  );
  const [question, setQuestion] = useState<string>("");

  const handleToggle = (id: string): void => {
    setSelectedFigureIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((existingId) => existingId !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const validation = roundtableInputSchema.safeParse({
    themeSlug,
    figureIds: selectedFigureIds,
    question,
  });

  const canSubmit = validation.success;

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const params = new URLSearchParams({
      theme: themeSlug,
      figures: selectedFigureIds.join(","),
      q: question.trim(),
    });

    router.push(`/roundtable?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <FigurePicker
        figures={availableFigures}
        selectedIds={selectedFigureIds}
        onToggle={handleToggle}
        min={2}
        max={3}
      />

      {suggestedQuestions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Suggested questions
          </label>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuestion(q)}
                className="text-left text-xs sm:text-sm px-3.5 py-2 rounded-full border border-line bg-paper text-ink hover:border-blue hover:text-blue transition-colors cursor-pointer shadow-pill"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="roundtable-question"
            className="font-display font-semibold text-base text-ink"
          >
            Your question for the table
          </label>
          <span
            className={`text-xs ${
              question.length > 1000
                ? "text-red-500 font-semibold"
                : "text-muted"
            }`}
          >
            {question.length} / 1000
          </span>
        </div>

        <textarea
          id="roundtable-question"
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the table anything… (10–1000 characters)"
          className="w-full p-4 rounded-xl border-2 border-line bg-paper text-ink placeholder:text-muted/60 focus:border-blue focus:outline-none transition-colors resize-y text-base"
        />
        <p className="text-xs text-muted">
          Each selected figure will answer in their own voice, with a verbatim passage and plain-English explanation.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full border-2 border-blue bg-blue px-7 py-3.5 text-base font-semibold text-action-ink shadow-ask transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:opacity-95"
        >
          Start roundtable
        </button>
      </div>
    </form>
  );
}
