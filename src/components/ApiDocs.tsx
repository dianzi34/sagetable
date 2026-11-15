"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

interface ApiDocsProps {
  url?: string;
}

export function ApiDocs({ url = "/api/openapi" }: ApiDocsProps) {
  return (
    <div id="swagger-ui" data-url={url} className="min-h-screen bg-white">
      <SwaggerUI url={url} />
    </div>
  );
}
