import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("swagger-ui-react", () => ({
  default: vi.fn(({ url }: { url: string }) => (
    <div id="swagger-ui" data-testid="swagger-ui" data-url={url}>
      Swagger UI Mock
    </div>
  )),
}));

import ApiDocsPage from "./page";

describe("/api-docs page", () => {
  it("renders the Swagger UI container loading from /api/openapi", async () => {
    const ui = await ApiDocsPage();
    render(ui);

    const swaggerEl = document.getElementById("swagger-ui");
    expect(swaggerEl).not.toBeNull();
    expect(swaggerEl?.getAttribute("data-url")).toBe("/api/openapi");
  });
});
