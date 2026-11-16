import type { Metadata } from "next";
import { ApiDocs } from "@/components/ApiDocs";

export const metadata: Metadata = {
  title: "API Documentation | SageTable",
  description: "Interactive OpenAPI documentation for SageTable",
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <ApiDocs url="/api/openapi" />
    </main>
  );
}
