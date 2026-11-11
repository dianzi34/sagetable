import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
