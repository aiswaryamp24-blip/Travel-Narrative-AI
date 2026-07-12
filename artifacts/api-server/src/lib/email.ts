import { ReplitConnectors } from '@replit/connectors-sdk';
import { logger } from './logger';

const connectors = new ReplitConnectors();

/** Default "from" address — Resend's shared sandbox sender, usable without a verified domain. */
const DEFAULT_FROM_ADDRESS = 'Turasum <onboarding@resend.dev>';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Sends an email through the Resend connector. Throws on failure — callers decide how to handle it. */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  const response = await connectors.proxy('resend', '/emails', {
    method: 'POST',
    body: {
      from: process.env.EMAIL_FROM_ADDRESS || DEFAULT_FROM_ADDRESS,
      to: [to],
      subject,
      html,
      text,
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

  const appUrl = `${getAppUrl()}/profile`;
  const tripWord = tripCount === 1 ? 'trip' : 'trips';
  const subject = 'Your travel wrapped is ready 🎉';
  const text = `Hi ${displayName},\n\nYour new travel wrapped is ready — a recap of ${tripCount} ${tripWord}. View and download it here: ${appUrl}\n\n— Turasum`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 20px;">Your travel wrapped is ready 🎉</h1>
      <p>Hi ${displayName},</p>
      <p>We just put together your latest travel wrapped — a recap of <strong>${tripCount} ${tripWord}</strong>.</p>
      <p>
        <a href="${appUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">
          View your wrapped
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">— Turasum</p>
    </div>
  `;

  try {
    await sendEmail({ to: email, subject, html, text });
    logger.info({ userId, digestId }, 'Sent digest-ready email');
  } catch (error) {
    logger.error({ err: error, userId, digestId }, 'Failed to send digest-ready email');
  }
}
