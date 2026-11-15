"use client";

import { useState } from "react";
import type { Figure } from "@prisma/client";
import type { CreateFigureInput } from "@/lib/curator";

interface FigureEditorProps {
  figures: Figure[];
  onSaveFigure: (input: CreateFigureInput) => void;
}

export function FigureEditor({
  figures,
  onSaveFigure,
}: FigureEditorProps): React.JSX.Element {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [field, setField] = useState("");
  const [era, setEra] = useState("");
  const [bio, setBio] = useState("");
  const [avatarKey, setAvatarKey] = useState("");

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSaveFigure({
      slug,
      name,
      field,
      era,
      bio,
      avatarKey,
    });
    setSlug("");
    setName("");
    setField("");
    setEra("");
    setBio("");
    setAvatarKey("");
  };

  return (
    <section className="bg-white border-2 border-[#232323] p-6 shadow-[3px_3px_0px_#232323]">
      <h2 className="text-xl font-bold text-[#232323] mb-4">Historical Figures</h2>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#6b6b6b] uppercase mb-2">Existing Figures ({figures.length})</h3>
        <ul className="divide-y divide-[#e6e6e6]">
          {figures.map((fig) => (
            <li key={fig.id} className="py-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-[#232323]">{fig.name}</span>
              <span className="text-xs text-[#6b6b6b] font-mono">{fig.field} ({fig.era})</span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="border-t-2 border-[#e6e6e6] pt-4 space-y-3">
        <h3 className="text-base font-bold text-[#232323]">Add New Figure</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="fig-slug" className="block text-xs font-bold text-[#232323] mb-1">
              Slug
            </label>
            <input
              id="fig-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. hypatia"
              className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
            />
          </div>
          <div>
            <label htmlFor="fig-name" className="block text-xs font-bold text-[#232323] mb-1">
              Name
            </label>
            <input
              id="fig-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hypatia of Alexandria"
              className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
            />
          </div>
          <div>
            <label htmlFor="fig-field" className="block text-xs font-bold text-[#232323] mb-1">
              Field
            </label>
            <input
              id="fig-field"
              type="text"
              required
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="e.g. Mathematics & Astronomy"
              className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
            />
          </div>
          <div>
            <label htmlFor="fig-era" className="block text-xs font-bold text-[#232323] mb-1">
              Era
            </label>
            <input
              id="fig-era"
              type="text"
              required
              value={era}
              onChange={(e) => setEra(e.target.value)}
              placeholder="e.g. c. 360 – 415 AD"
              className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="fig-bio" className="block text-xs font-bold text-[#232323] mb-1">
            Biography
          </label>
          <textarea
            id="fig-bio"
            required
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short biographical background..."
            className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
          />
        </div>

        <div>
          <label htmlFor="fig-avatar-key" className="block text-xs font-bold text-[#232323] mb-1">
            Avatar Key
          </label>
          <input
            id="fig-avatar-key"
            type="text"
            required
            value={avatarKey}
            onChange={(e) => setAvatarKey(e.target.value)}
            placeholder="e.g. hypatia"
            className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
          />
        </div>

        <button
          type="submit"
          className="bg-[#2d5be3] text-white px-4 py-2 font-semibold text-sm border-2 border-[#232323] shadow-[2px_2px_0px_#232323] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#232323] transition-all"
        >
          Create figure
        </button>
      </form>
    </section>
  );
}
