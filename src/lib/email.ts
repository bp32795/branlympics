import "server-only";
import { Resend } from "resend";
import { env } from "./env";

let _resend: Resend | null = null;
function client() {
  if (!_resend) _resend = new Resend(env.resendApiKey);
  return _resend;
}

interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendArgs) {
  // Don't throw on email failures — log and continue so the user-facing
  // action still succeeds.
  try {
    await client().emails.send({
      from: env.emailFrom,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function newGameEmail(opts: {
  gameTitle: string;
  gameDescription: string;
  gameUrl: string;
}) {
  return {
    subject: `New Branlympics game: ${opts.gameTitle}`,
    html: `
      <h2>A new game just dropped 🏆</h2>
      <h3>${escapeHtml(opts.gameTitle)}</h3>
      <p>${escapeHtml(opts.gameDescription)}</p>
      <p><a href="${opts.gameUrl}">Sign up now →</a></p>
    `,
  };
}

export function teamRequestEmail(opts: {
  fromName: string;
  gameTitle: string;
  gameUrl: string;
}) {
  return {
    subject: `${opts.fromName} wants to team up for ${opts.gameTitle}`,
    html: `
      <h2>Team-up request</h2>
      <p><strong>${escapeHtml(opts.fromName)}</strong> wants to team up
      with you for <strong>${escapeHtml(opts.gameTitle)}</strong>.</p>
      <p><a href="${opts.gameUrl}">Accept or decline →</a></p>
    `,
  };
}
