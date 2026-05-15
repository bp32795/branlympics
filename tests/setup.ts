// Strip "server-only" import so server-side modules can be loaded in tests.
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

// Provide harmless env defaults so importing `@/lib/env` doesn't blow up.
process.env.COSMOS_ENDPOINT ??= "https://test.documents.azure.com:443/";
process.env.COSMOS_KEY ??= "test-key";
process.env.COSMOS_DATABASE ??= "branlympics-test";
process.env.RESEND_API_KEY ??= "test-resend";
process.env.EMAIL_FROM ??= "Test <test@example.com>";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
process.env.AUTH_SECRET ??= "test-secret-test-secret-test-secret-test";
