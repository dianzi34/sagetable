"use client";

import { useState } from "react";
import type { Figure } from "@prisma/client";
import type { UploadWorkInput } from "@/lib/curator";

interface WorkUploaderProps {
  figures: Pick<Figure, "id" | "name">[];
  onUploadWork: (input: UploadWorkInput) => void;
}

export function WorkUploader({
  figures,
  onUploadWork,
}: WorkUploaderProps): React.JSX.Element {
  const [figureId, setFigureId] = useState(figures[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState<string>("1890");
  const [sourceUrl, setSourceUrl] = useState("");
  const [publicDomainConfirmed, setPublicDomainConfirmed] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!publicDomainConfirmed) {
      setErrorMsg("You must confirm public-domain status before uploading.");
      return;
    }
    setErrorMsg(null);

    onUploadWork({
      figureId: figureId || (figures[0]?.id ?? ""),
      title,
      year: parseInt(year, 10),
      sourceUrl,
      publicDomainConfirmed: true,
      fileName: `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "work"}.txt`,
      textContent,
    });

    setTitle("");
    setSourceUrl("");
    setPublicDomainConfirmed(false);
    setTextContent("");
  };

  return (
    <section className="bg-white border-2 border-[#232323] p-6 shadow-[3px_3px_0px_#232323]">
      <h2 className="text-xl font-bold text-[#232323] mb-4">Upload Public-Domain Work</h2>
      <p className="text-sm text-[#6b6b6b] mb-4">
        Upload complete or excerpted texts (.txt / .md). The system splits text into readable passages
        and generates full-text search vectors in PostgreSQL.
      </p>

      {errorMsg && (
        <div role="alert" className="p-3 mb-4 bg-red-50 text-red-800 border-2 border-[#232323] text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="work-figure" className="block text-xs font-bold text-[#232323] mb-1">
              Select figure
            </label>
            <select
              id="work-figure"
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
            <label htmlFor="work-title" className="block text-xs font-bold text-[#232323] mb-1">
              Work title
            </label>
            <input
              id="work-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Life on the Mississippi"
              className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
            />
          </div>

          <div>
            <label htmlFor="work-year" className="block text-xs font-bold text-[#232323] mb-1">
              Publication year
            </label>
            <input
              id="work-year"
              type="number"
              required
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="work-source-url" className="block text-xs font-bold text-[#232323] mb-1">
            Source URL
          </label>
          <input
            id="work-source-url"
            type="url"
            required
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="e.g. https://www.gutenberg.org/ebooks/245"
            className="w-full border-2 border-[#232323] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
          />
        </div>

        <div>
          <label htmlFor="work-content" className="block text-xs font-bold text-[#232323] mb-1">
            Text content
          </label>
          <textarea
            id="work-content"
            required
            rows={6}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Paste text or markdown with ## chapter headings..."
            className="w-full font-mono border-2 border-[#232323] p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
          />
        </div>

        <div className="flex items-center gap-2 border-2 border-[#232323] bg-[#f2efea]/40 p-3">
          <input
            id="work-pd-confirm"
            type="checkbox"
            checked={publicDomainConfirmed}
            onChange={(e) => setPublicDomainConfirmed(e.target.checked)}
            className="w-4 h-4 accent-[#2d5be3] border-2 border-[#232323]"
          />
          <label htmlFor="work-pd-confirm" className="text-xs font-bold text-[#232323] cursor-pointer">
            Confirm public domain status: I verify this work is in the public domain and free of copyright restrictions.
          </label>
        </div>

        <button
          type="submit"
          className="bg-[#2d5be3] text-white px-4 py-2 font-semibold text-sm border-2 border-[#232323] shadow-[2px_2px_0px_#232323] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#232323] transition-all"
        >
          Upload & chunk text
        </button>
      </form>
    </section>
  );
}
