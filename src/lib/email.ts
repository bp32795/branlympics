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
      headers: bulkHeaders(),
    });
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}

// Gmail flags a single message with many To: recipients as a bulk blast and
// rate-limits the sending domain. Send one personalized message per recipient
// via Resend's batch endpoint (up to 100 per call) instead.
export async function sendBulkEmail({
  to,
  subject,
  html,
}: {
  to: string[];
  subject: string;
  html: string;
}) {
  const recipients = Array.from(new Set(to.filter(Boolean)));
  if (!recipients.length) return;
  const from = env.emailFrom;
  const headers = bulkHeaders();
  const chunkSize = 100;
  for (let i = 0; i < recipients.length; i += chunkSize) {
    const chunk = recipients.slice(i, i + chunkSize);
    try {
      await client().batch.send(
        chunk.map((addr) => ({ from, to: addr, subject, html, headers })),
      );
    } catch (err) {
      console.error("[email] bulk send failed:", err);
    }
  }
}

function bulkHeaders(): Record<string, string> {
  const unsubUrl = `${env.appUrl}/account`;
  return {
    "List-Unsubscribe": `<${unsubUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
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

export function gameSuggestionEmail(opts: {
  fromName: string;
  fromEmail: string;
  title: string;
  description: string;
  minTeamSize: number;
  maxTeamSize: number;
  note?: string;
  reviewUrl: string;
}) {
  const teamSize =
    opts.minTeamSize === opts.maxTeamSize
      ? `${opts.minTeamSize} per team`
      : `${opts.minTeamSize}–${opts.maxTeamSize} per team`;
  return {
    subject: `New Branlympics game suggestion: ${opts.title}`,
    html: `
      <h2>New game suggestion 💡</h2>
      <p>From <strong>${escapeHtml(opts.fromName)}</strong>
      (${escapeHtml(opts.fromEmail)})</p>
      <h3>${escapeHtml(opts.title)}</h3>
      <p>${escapeHtml(opts.description)}</p>
      <p><em>Team size:</em> ${escapeHtml(teamSize)}</p>
      ${opts.note ? `<p><em>Note:</em> ${escapeHtml(opts.note)}</p>` : ""}
      <p><a href="${opts.reviewUrl}">Review in admin →</a></p>
    `,
  };
}
