"use client";

import { useState } from "react";
import type { Figure, Theme } from "@prisma/client";
import type { CreateThemeInput } from "@/lib/curator";

interface ThemeEditorProps {
  themes: (Theme & { figures?: { figureId: string }[] })[];
  figures: Pick<Figure, "id" | "name">[];
  onSaveTheme: (input: CreateThemeInput) => void;
}

export function ThemeEditor({
  themes,
  figures,
  onSaveTheme,
}: ThemeEditorProps): React.JSX.Element {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFigureIds, setSelectedFigureIds] = useState<string[]>([]);

  const handleToggleFigure = (figId: string): void => {
    setSelectedFigureIds((prev) =>
      prev.includes(figId) ? prev.filter((id) => id !== figId) : [...prev, figId],
    );
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSaveTheme({
      slug,
      name,
      description,
      suggestedQuestions: [],
      figureIds: selectedFigureIds,
    });
    setSlug("");
    setName("");
    setDescription("");
    setSelectedFigureIds([]);
  };

  return (
    <section className="bg-white border-2 border-[#232323] p-6 shadow-[3px_3px_0px_#232323]">
      <h2 className="text-xl font-bold text-[#232323] mb-4">Themes</h2>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#6b6b6b] uppercase mb-2">Existing Themes ({themes.length})</h3>
        <ul className="divide-y divide-[#e6e6e6]">
          {themes.map((theme) => (
            <li key={theme.id} className="py-2 text-sm">
              <span className="font-semibold text-[#232323]">{theme.name}</span>
              <p className="text-xs text-[#6b6b6b]">{theme.description}</p>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="border-t-2 border-[#e6e6e6] pt-4 space-y-3">
        <h3 className="text-base font-bold text-[#232323]">Add New Theme</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="theme-slug" className="block text-xs font-bold text-[#232323] mb-1">
              Theme slug
            </label>
            <input
              id="theme-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. resilience"
              className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
            />
          </div>
          <div>
            <label htmlFor="theme-name" className="block text-xs font-bold text-[#232323] mb-1">
              Theme name
            </label>
            <input
              id="theme-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Resilience & Adversity"
              className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="theme-desc" className="block text-xs font-bold text-[#232323] mb-1">
            Description
          </label>
          <textarea
            id="theme-desc"
            required
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Theme summary..."
            className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
          />
        </div>

        <div>
          <span className="block text-xs font-bold text-[#232323] mb-1">
            Assign figures
          </span>
          <div className="flex flex-wrap gap-2">
            {figures.map((fig) => (
              <label
                key={fig.id}
                className={`cursor-pointer px-3 py-1 border-2 border-[#232323] text-xs font-semibold ${
                  selectedFigureIds.includes(fig.id)
                    ? "bg-[#2d5be3] text-white"
                    : "bg-white text-[#232323]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFigureIds.includes(fig.id)}
                  onChange={() => handleToggleFigure(fig.id)}
                  className="sr-only"
                />
                {fig.name}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-[#2d5be3] text-white px-4 py-2 font-semibold text-sm border-2 border-[#232323] shadow-[2px_2px_0px_#232323] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#232323] transition-all"
        >
          Create theme
        </button>
      </form>
    </section>
  );
}
