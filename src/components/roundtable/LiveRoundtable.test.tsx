import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveRoundtable } from "./LiveRoundtable";

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Map<string, Set<(event: MessageEvent) => void>> = new Map();
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, data: unknown): void {
    const set = this.listeners.get(type);
    if (!set) return;
    const event = { data: JSON.stringify(data) } as MessageEvent;
    for (const listener of Array.from(set)) {
      listener(event);
    }
  }
}

describe("LiveRoundtable", () => {
  const originalEventSource = globalThis.EventSource;

  beforeEach(() => {
    MockEventSource.instances = [];
    vi.restoreAllMocks();
    // @ts-expect-error mock EventSource
    globalThis.EventSource = MockEventSource;
  });

  afterEach(() => {
    globalThis.EventSource = originalEventSource;
  });

  it("calls close() on EventSource after receiving 'done' event and ignores error after done", async () => {
    render(<LiveRoundtable roundtableId="rt-test-1" />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.emit("figure-start", {
        figureId: "mark-twain",
        figure: {
          id: "mark-twain",
          slug: "mark-twain",
          name: "Mark Twain",
          field: "Writer",
          era: "1835–1910",
        },
      });
      es.emit("chunk", {
        figureId: "mark-twain",
        text: "The secret of getting ahead is getting started.",
      });
      es.emit("figure-done", {
        figureId: "mark-twain",
        passages: [],
      });
      es.emit("done", { status: "complete" });
    });

    expect(es.close).toHaveBeenCalled();
    expect(MockEventSource.instances.length).toBe(1);

    // Browser disconnect triggers error on closed stream; should be ignored after done
    act(() => {
      es.emit("error", {});
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls close() on EventSource when component unmounts", async () => {
    const { unmount } = render(<LiveRoundtable roundtableId="rt-test-2" />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1);
    });

    const es = MockEventSource.instances[0];
    unmount();

    expect(es.close).toHaveBeenCalled();
  });

  it("renders card text exactly once if the same events are replayed on reconnect", async () => {
    const figureIds = ["mark-twain"];
    render(
      <LiveRoundtable
        roundtableId="rt-test-3"
        initialFigureIds={figureIds}
      />,
    );

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1);
    });

    const es = MockEventSource.instances[0];
    const figurePayload = {
      figureId: "mark-twain",
      figure: {
        id: "mark-twain",
        slug: "mark-twain",
        name: "Mark Twain",
        field: "Writer",
        era: "1835–1910",
      },
    };
    const chunkPayload = {
      figureId: "mark-twain",
      text: "The secret of getting ahead is getting started.",
    };

    // First playback
    act(() => {
      es.emit("figure-start", figurePayload);
      es.emit("chunk", chunkPayload);
      es.emit("figure-done", { figureId: "mark-twain", passages: [] });
    });

    // Replay (simulating browser auto-reconnect or stream replay)
    act(() => {
      es.emit("figure-start", figurePayload);
      es.emit("chunk", chunkPayload);
      es.emit("figure-done", { figureId: "mark-twain", passages: [] });
    });

    const card = screen.getByRole("article");
    const occurrences = (
      card.textContent?.match(
        /The secret of getting ahead is getting started\./g,
      ) ?? []
    ).length;
    expect(occurrences).toBe(1);
  });

  it("calls POST /api/roundtables only once under React StrictMode", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: "rt-strict",
          roundtable: {
            question: "How do I find work I love?",
            theme: { name: "Choosing a Career" },
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <React.StrictMode>
        <LiveRoundtable
          initialThemeSlug="choosing-a-career"
          initialFigureIds={["mark-twain"]}
          initialQuestion="How do I find work I love?"
        />
      </React.StrictMode>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
