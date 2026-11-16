import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("swagger-ui-react", () => ({
  default: vi.fn(({ url }: { url: string }) => (
    <div id="swagger-ui-mock" data-testid="swagger-ui" data-url={url}>
      Swagger UI Mock
    </div>
  )),
}));

import { ApiDocs } from "./ApiDocs";

describe("ApiDocs component", () => {
  it("renders SwaggerUI container configured with the spec URL", () => {
    render(<ApiDocs url="/api/openapi" />);
    const swaggerEl = document.getElementById("swagger-ui");
    expect(swaggerEl).not.toBeNull();
    const mockEl = document.getElementById("swagger-ui-mock");
    expect(mockEl?.getAttribute("data-url")).toBe("/api/openapi");
  });
});
