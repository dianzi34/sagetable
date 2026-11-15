"use client";

import { useState } from "react";
import type { Figure, Theme } from "@prisma/client";
import type { CreateAnswerBankEntryInput } from "@/lib/curator";
import type { AnswerWithRelations } from "@/server/services/curatorService";

interface AnswerEditorProps {
  answers: AnswerWithRelations[];
  figures: Pick<Figure, "id" | "name">[];
  themes: Pick<Theme, "id" | "name">[];
  onSaveAnswer: (input: CreateAnswerBankEntryInput) => void;
}

export function AnswerEditor({
  answers,
  figures,
  themes,
  onSaveAnswer,
}: AnswerEditorProps): React.JSX.Element {
  const [figureId, setFigureId] = useState(figures[0]?.id ?? "");
  const [themeId, setThemeId] = useState(themes[0]?.id ?? "");
  const [topicKeywords, setTopicKeywords] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSaveAnswer({
      figureId: figureId || (figures[0]?.id ?? ""),
      themeId: themeId || (themes[0]?.id ?? ""),
      topicKeywords,
      body,
      passages: [],
    });
    setTopicKeywords("");
    setBody("");
  };

  return (
    <section className="bg-white border-2 border-[#232323] p-6 shadow-[3px_3px_0px_#232323]">
      <h2 className="text-xl font-bold text-[#232323] mb-4">Curated Answer Bank</h2>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#6b6b6b] uppercase mb-2">Existing Answers ({answers.length})</h3>
        <ul className="divide-y divide-[#e6e6e6] max-h-60 overflow-y-auto">
          {answers.map((ans) => (
            <li key={ans.id} className="py-2 text-sm">
              <span className="font-semibold text-[#232323] block">{ans.body}</span>
              <span className="text-xs text-[#6b6b6b] font-mono">
                Keywords: {ans.topicKeywords}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="border-t-2 border-[#e6e6e6] pt-4 space-y-3">
        <h3 className="text-base font-bold text-[#232323]">Add Answer Bank Entry</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="ans-figure" className="block text-xs font-bold text-[#232323] mb-1">
              Select figure
            </label>
            <select
              id="ans-figure"
              value={figureId}
              onChange={(e) => setFigureId(e.target.value)}
              className="w-full border-2 border-[#232323] bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
            >
              {figures.map((fig) => (
                <option key={fig.id} value={fig.id}>
                  {fig.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ans-theme" className="block text-xs font-bold text-[#232323] mb-1">
              Select theme
            </label>
            <select
              id="ans-theme"
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              className="w-full border-2 border-[#232323] bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
            >
              {themes.map((th) => (
                <option key={th.id} value={th.id}>
                  {th.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="ans-keywords" className="block text-xs font-bold text-[#232323] mb-1">
            Topic keywords
          </label>
          <input
            id="ans-keywords"
            type="text"
            required
            value={topicKeywords}
            onChange={(e) => setTopicKeywords(e.target.value)}
            placeholder="e.g. perseverance struggle failure success"
            className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
          />
        </div>

        <div>
          <label htmlFor="ans-body" className="block text-xs font-bold text-[#232323] mb-1">
            Answer body
          </label>
          <textarea
            id="ans-body"
            required
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="The curated interpretation in the figure's voice..."
            className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
          />
        </div>

        <button
          type="submit"
          className="bg-[#2d5be3] text-white px-4 py-2 font-semibold text-sm border-2 border-[#232323] shadow-[2px_2px_0px_#232323] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#232323] transition-all"
        >
          Create answer
        </button>
      </form>
    </section>
  );
}
