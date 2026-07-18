import { ReplitConnectors } from '@replit/connectors-sdk';
import { logger } from './logger';

const connectors = new ReplitConnectors();

/**
 * Fallback "from" address — Resend's shared sandbox sender.
 * Only usable for testing; has strict sending limits and hurts deliverability.
 * Set EMAIL_FROM_ADDRESS (as a Replit Secret) to an address on a Resend-verified
 * domain (e.g. "Turasum <noreply@yourdomain.com>") to send from your own domain.
 */
const SANDBOX_FROM_ADDRESS = 'Turasum <onboarding@resend.dev>';

/** Resolve the configured sender and warn loudly if we're still on the sandbox address. */
function resolveFromAddress(): string {
  const configured = process.env.EMAIL_FROM_ADDRESS;
  if (configured) return configured;
  logger.warn(
    { sender: SANDBOX_FROM_ADDRESS },
    'EMAIL_FROM_ADDRESS is not set — emails will be sent from the Resend sandbox sender. ' +
      'Verify a domain in the Resend account and set EMAIL_FROM_ADDRESS to a real address on that domain.',
  );
  return SANDBOX_FROM_ADDRESS;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Optional RFC 2369 / RFC 8058 list-management headers for transactional mail. */
  headers?: Record<string, string>;
  replyTo?: string;
}

/** Sends an email through the Resend connector. Throws on failure — callers decide how to handle it. */
export async function sendEmail({ to, subject, html, text, headers, replyTo }: SendEmailOptions): Promise<void> {
  const response = await connectors.proxy('resend', '/emails', {
    method: 'POST',
    body: {
      from: resolveFromAddress(),
      to: [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(headers ? { headers } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend request failed: ${response.status} ${response.statusText} ${body}`);
  }
}

/** Base URL of the deployed app, for building links back into it from emails. */
export function getAppUrl(): string {
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0]?.trim();
  return domain ? `https://${domain}` : 'http://localhost:5000';
}

/**
 * Builds the HTML footer appended to every digest-ready email.
 * Contains an unsubscribe link so users can opt out without contacting support,
 * and so Gmail / Outlook don't classify the message as bulk mail.
 */
function buildDigestEmailFooter(userId: string, appUrl: string): { html: string; text: string } {
  const settingsUrl = `${appUrl}/profile`;
  const html = `
    <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; color: #888; font-size: 12px; line-height: 1.5;">
      You're receiving this because digest emails are enabled for your Turasum account.<br>
      <a href="${settingsUrl}" style="color: #888;">Manage email preferences</a>
    </p>
  `;
  const text = `\n\n---\nYou're receiving this because digest emails are enabled for your Turasum account.\nManage email preferences: ${settingsUrl}`;
  return { html, text };
}

/**
 * Notifies a user that a new trip digest is ready. No-ops (with a log line)
 * if the recipient has no address, so callers can call this unconditionally.
 */
export async function sendDigestReadyEmail(params: {
  userId: string;
  email: string | null | undefined;
  displayName: string;
  digestId: number;
  tripCount: number;
}): Promise<void> {
  const { userId, email, displayName, digestId, tripCount } = params;

  if (!email) {
    logger.info({ userId, digestId }, 'Skipping digest-ready email — no verified email on file');
    return;
  }

  const appUrl = getAppUrl();
  const settingsUrl = `${appUrl}/profile`;
  const profileUrl = `${appUrl}/profile`;
  const tripWord = tripCount === 1 ? 'trip' : 'trips';
  const subject = 'Your travel wrapped is ready 🎉';

  const footer = buildDigestEmailFooter(userId, appUrl);

  const text =
    `Hi ${displayName},\n\nYour new travel wrapped is ready — a recap of ${tripCount} ${tripWord}. View and download it here: ${profileUrl}` +
    footer.text;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 20px;">Your travel wrapped is ready 🎉</h1>
      <p>Hi ${displayName},</p>
      <p>We just put together your latest travel wrapped — a recap of <strong>${tripCount} ${tripWord}</strong>.</p>
      <p>
        <a href="${profileUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">
          View your wrapped
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">— Turasum</p>
      ${footer.html}
    </div>
  `;

  /**
   * List-Unsubscribe / List-Unsubscribe-Post (RFC 2369 + RFC 8058)
   *
   * Gmail and Outlook use these headers to:
   *   1. Show a native "Unsubscribe" link at the top of the message (keeps users from
   *      hitting the spam button instead).
   *   2. Route the email to the Primary tab rather than Promotions/Spam when the
   *      sender publishes one-click unsubscribe correctly.
   *
   * The HTTPS URL must handle a POST with body "List-Unsubscribe=One-Click".
   * We point it at the settings page (human-readable fallback) because a
   * machine-readable one-click POST endpoint doesn't exist yet; add one when
   * needed to satisfy Gmail's bulk-sender requirements (≥5 k/day).
   */
  const headers: Record<string, string> = {
    'List-Unsubscribe': `<${settingsUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };

  try {
    await sendEmail({ to: email, subject, html, text, headers });
    logger.info({ userId, digestId }, 'Sent digest-ready email');
  } catch (error) {
    logger.error({ err: error, userId, digestId }, 'Failed to send digest-ready email');
  }
}
