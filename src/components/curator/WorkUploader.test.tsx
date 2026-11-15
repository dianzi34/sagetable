import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkUploader } from "./WorkUploader";

describe("WorkUploader", () => {
  const mockFigures = [{ id: "fig-1", name: "Mark Twain" }];

  it("renders upload form with public domain checkbox", () => {
    render(<WorkUploader figures={mockFigures} onUploadWork={vi.fn()} />);

    expect(screen.getByLabelText(/select figure/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/publication year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/source url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm public domain/i)).toBeInTheDocument();
  });

  it("requires public domain confirmation before uploading", () => {
    const onUpload = vi.fn();
    render(<WorkUploader figures={mockFigures} onUploadWork={onUpload} />);

    fireEvent.change(screen.getByLabelText(/select figure/i), { target: { value: "fig-1" } });
    fireEvent.change(screen.getByLabelText(/work title/i), { target: { value: "Roughing It" } });
    fireEvent.change(screen.getByLabelText(/publication year/i), { target: { value: "1872" } });
    fireEvent.change(screen.getByLabelText(/source url/i), { target: { value: "https://gutenberg.org" } });
    fireEvent.change(screen.getByLabelText(/text content/i), { target: { value: "Paragraph 1\n\nParagraph 2" } });

    // Without checking public domain checkbox
    fireEvent.click(screen.getByRole("button", { name: /upload & chunk text/i }));
    expect(onUpload).not.toHaveBeenCalled();

    // Check public domain checkbox
    fireEvent.click(screen.getByLabelText(/confirm public domain/i));
    fireEvent.click(screen.getByRole("button", { name: /upload & chunk text/i }));

    expect(onUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Roughing It",
        publicDomainConfirmed: true,
      }),
    );
  });
});
