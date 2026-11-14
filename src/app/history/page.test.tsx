import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/session", () => ({
  requireUser: vi.fn().mockResolvedValue({
    id: "user-1",
    email: "user@example.com",
    role: "USER",
  }),
}));

vi.mock("@/server/services/roundtableService", () => ({
  listUserRoundtables: vi.fn().mockResolvedValue([
    {
      id: "rt-1",
      question: "How do I choose between two careers I love?",
      createdAt: new Date("2026-11-14T10:00:00Z"),
      theme: { name: "Choosing a Career", slug: "choosing-a-career" },
      answers: [
        {
          id: "ans-1",
          figure: { id: "fig-twain", name: "Mark Twain", slug: "mark-twain" },
          status: "completed",
        },
      ],
    },
  ]),
}));

import HistoryPage from "./page";

describe("HistoryPage", () => {
  it("renders user past roundtables with links to each", async () => {
    const ui = await HistoryPage();
    render(ui);

    expect(screen.getByRole("heading", { name: /roundtable history/i })).toBeDefined();
    expect(screen.getByText("How do I choose between two careers I love?")).toBeDefined();
    expect(screen.getByText("Choosing a Career")).toBeDefined();
    const link = screen.getByRole("link", { name: /view roundtable/i });
    expect(link.getAttribute("href")).toContain("/roundtable?id=rt-1");
  });
});
