// Centralized env access. Throws clearly when something required is missing
// at request time (not at import time, so `next build` still works without
// a fully-populated .env).

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  get cosmosEndpoint() {
    return required("COSMOS_ENDPOINT");
  },
  get cosmosKey() {
    return required("COSMOS_KEY");
  },
  get cosmosDatabase() {
    return process.env.COSMOS_DATABASE ?? "branlympics";
  },
  get resendApiKey() {
    return required("RESEND_API_KEY");
  },
  get emailFrom() {
    return process.env.EMAIL_FROM ?? "Branlympics <onboarding@resend.dev>";
  },
  get appUrl() {
    return (
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.AUTH_URL ??
      "http://localhost:3000"
    );
  },
};
