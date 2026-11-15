import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ApiDocsPage from "./page";

describe("/api-docs page", () => {
  it("renders the Swagger UI mount container", async () => {
    const ui = await ApiDocsPage();
    render(ui);

    const swaggerEl = document.getElementById("swagger-ui");
    expect(swaggerEl).not.toBeNull();
  });
});
