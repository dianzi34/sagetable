import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FigureAvatar } from "./FigureAvatar";

describe("FigureAvatar", () => {
  it("renders an accessible name for the figure", () => {
    render(<FigureAvatar slug="mark-twain" name="Mark Twain" />);

    expect(screen.getByRole("img", { name: /Mark Twain/i })).toBeInTheDocument();
  });

  it("renders an accessible name for another figure", () => {
    render(<FigureAvatar slug="vincent-van-gogh" name="Vincent van Gogh" />);

    expect(
      screen.getByRole("img", { name: /Vincent van Gogh/i }),
    ).toBeInTheDocument();
  });

  it("uses each figure's accent color on the avatar ring", () => {
    render(<FigureAvatar slug="mark-twain" name="Mark Twain" />);
    const twainAvatar = screen.getByRole("img", { name: /Mark Twain/i });
    const twainRing = twainAvatar.querySelector("circle");
    expect(twainRing).toHaveAttribute(
      "stroke",
      expect.stringContaining("--accent-twain"),
    );

    render(<FigureAvatar slug="helen-keller" name="Helen Keller" />);
    const kellerAvatar = screen.getByRole("img", { name: /Helen Keller/i });
    const kellerRing = kellerAvatar.querySelector("circle");
    expect(kellerRing).toHaveAttribute(
      "stroke",
      expect.stringContaining("--accent-keller"),
    );
  });
});
