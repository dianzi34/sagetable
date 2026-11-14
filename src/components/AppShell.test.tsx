import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("renders a header with the SageTable wordmark and navigation links", () => {
    render(
      <AppShell>
        <p>Page content</p>
      </AppShell>,
    );

    const header = screen.getByRole("banner");
    expect(within(header).getByText("SageTable")).toBeInTheDocument();

    const nav = within(header).getByRole("navigation");
    expect(within(nav).getByRole("link", { name: "Roundtable" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows the signed-in user and a Sign out button instead of Sign in when user prop is provided", () => {
    render(
      <AppShell
        user={{ id: "user-1", email: "curie@example.com", role: "curator" }}
      >
        <p>Page content</p>
      </AppShell>,
    );

    const nav = screen.getByRole("navigation");
    expect(within(nav).getByText("curie@example.com")).toBeInTheDocument();
    expect(
      within(nav).getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
    expect(
      within(nav).queryByRole("link", { name: "Sign in" }),
    ).not.toBeInTheDocument();
  });

  it("renders a main landmark containing page children", () => {
    render(
      <AppShell>
        <p>Page content</p>
      </AppShell>,
    );

    const main = screen.getByRole("main");
    expect(within(main).getByText("Page content")).toBeInTheDocument();
  });

  it("renders the curated interpretation disclaimer in the footer", () => {
    render(
      <AppShell>
        <p>Page content</p>
      </AppShell>,
    );

    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getByText(
        "Answers are curated interpretations written in each figure's voice, with verbatim original passages.",
      ),
    ).toBeInTheDocument();
  });
});
