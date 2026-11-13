"use client";

import { useState } from "react";
import type { Figure, Theme } from "@prisma/client";
import type {
  CreateAnswerBankEntryInput,
  CreateFigureInput,
  CreateThemeInput,
  UploadWorkInput,
} from "@/lib/curator";
import type { AnswerWithRelations } from "@/server/services/curatorService";
import { AnswerEditor } from "./AnswerEditor";
import { FigureEditor } from "./FigureEditor";
import { ThemeEditor } from "./ThemeEditor";
import { WorkUploader } from "./WorkUploader";

interface CuratorDashboardClientProps {
  initialFigures: Figure[];
  initialThemes: (Theme & { figures?: { figureId: string }[] })[];
  initialAnswers: AnswerWithRelations[];
}

export function CuratorDashboardClient({
  initialFigures,
  initialThemes,
  initialAnswers,
}: CuratorDashboardClientProps): React.JSX.Element {
  const [figures, setFigures] = useState<Figure[]>(initialFigures);
  const [themes, setThemes] = useState<(Theme & { figures?: { figureId: string }[] })[]>(
    initialThemes,
  );
  const [answers, setAnswers] = useState<AnswerWithRelations[]>(initialAnswers);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSaveFigure = async (input: CreateFigureInput): Promise<void> => {
    try {
      setNotification(null);
      const res = await fetch("/api/curator/figures", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setNotification({
          type: "error",
          message: errorData.error?.message ?? "Failed to create figure",
        });
        return;
      }

      const data = await res.json();
      setFigures((prev) => [...prev, data.data.figure]);
      setNotification({
        type: "success",
        message: `Figure "${input.name}" created successfully.`,
      });
    } catch {
      setNotification({
        type: "error",
        message: "An error occurred while creating the figure.",
      });
    }
  };

  const handleSaveTheme = async (input: CreateThemeInput): Promise<void> => {
    try {
      setNotification(null);
      const res = await fetch("/api/curator/themes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setNotification({
          type: "error",
          message: errorData.error?.message ?? "Failed to create theme",
        });
        return;
      }

      const data = await res.json();
      setThemes((prev) => [...prev, data.data.theme]);
      setNotification({
        type: "success",
        message: `Theme "${input.name}" created successfully.`,
      });
    } catch {
      setNotification({
        type: "error",
        message: "An error occurred while creating the theme.",
      });
    }
  };

  const handleUploadWork = async (input: UploadWorkInput): Promise<void> => {
    try {
      setNotification(null);
      const res = await fetch("/api/curator/works/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setNotification({
          type: "error",
          message: errorData.error?.message ?? "Failed to upload work",
        });
        return;
      }

      const data = await res.json();
      setNotification({
        type: "success",
        message: `Work "${input.title}" uploaded and chunked into ${data.data.passageCount} passages.`,
      });
    } catch {
      setNotification({
        type: "error",
        message: "An error occurred while uploading the work.",
      });
    }
  };

  const handleSaveAnswer = async (
    input: CreateAnswerBankEntryInput,
  ): Promise<void> => {
    try {
      setNotification(null);
      const res = await fetch("/api/curator/answers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setNotification({
          type: "error",
          message: errorData.error?.message ?? "Failed to create answer",
        });
        return;
      }

      const data = await res.json();
      setAnswers((prev) => [...prev, data.data.answer]);
      setNotification({
        type: "success",
        message: "Curated answer created successfully.",
      });
    } catch {
      setNotification({
        type: "error",
        message: "An error occurred while creating the answer.",
      });
    }
  };

  return (
    <div className="space-y-8">
      {notification && (
        <div
          role={notification.type === "error" ? "alert" : "status"}
          className={`p-4 border-2 border-[#232323] shadow-[2px_2px_0px_#232323] ${
            notification.type === "error"
              ? "bg-red-50 text-red-800"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <FigureEditor figures={figures} onSaveFigure={handleSaveFigure} />
        <ThemeEditor
          themes={themes}
          figures={figures}
          onSaveTheme={handleSaveTheme}
        />
      </div>

      <WorkUploader figures={figures} onUploadWork={handleUploadWork} />

      <AnswerEditor
        answers={answers}
        figures={figures}
        themes={themes}
        onSaveAnswer={handleSaveAnswer}
      />
    </div>
  );
}
