import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION || "eu-west-1" });
const FRONTEND_URL = process.env.FRONTEND_URL || "https://lsptickethive.com";

// Resend (https://resend.com) is used when RESEND_API_KEY is set — it works
// without SES sandbox approval. Falls back to SES otherwise.
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

// Default sender: use Resend's shared onboarding domain until lsptickethive.com
// is verified in Resend, at which point set FROM_EMAIL to noreply@lsptickethive.com.
const FROM_EMAIL =
  process.env.FROM_EMAIL ||
  (RESEND_API_KEY ? "LSPTicketHive <onboarding@resend.dev>" : "mansaraysamuellamin001@gmail.com");

/**
 * Send one email via Resend (preferred) or SES (fallback).
 * Returns true on success. Never throws — callers shouldn't fail signup on a
 * mail hiccup, but we log loudly so failures are visible.
 */
export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const source = FROM_EMAIL.includes("<") ? FROM_EMAIL : `LSPTicketHive <${FROM_EMAIL}>`;

  if (RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: source, to: [to], subject, html, text }),
      });
      if (!res.ok) {
        console.error("Resend send failed:", res.status, await res.text());
        return false;
      }
      return true;
    } catch (err) {
      console.error("Resend send error:", err);
      return false;
    }
  }

  try {
    await ses.send(
      new SendEmailCommand({
        Source: source,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: { Html: { Data: html }, Text: { Data: text } },
        },
      })
    );
    return true;
  } catch (err) {
    console.error("SES send failed:", err);
    return false;
  }
}

export async function sendVerificationCode(toEmail: string, code: string, name: string): Promise<boolean> {
  const subject = `${code} is your LSPTicketHive verification code`;
  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:400px;margin:0 auto;padding:40px 20px;text-align:center;">
      <h2 style="color:#22c55e;margin-bottom:8px;">LSPTicketHive</h2>
      <p style="color:#666;margin-bottom:24px;">Hi ${name}, verify your email to get started.</p>
      <div style="background:#f5f5f5;border-radius:12px;padding:24px;margin-bottom:24px;">
        <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111;">${code}</span>
      </div>
      <p style="color:#999;font-size:13px;">This code expires in 10 minutes.</p>
    </div>`;
  const text = `Your LSPTicketHive verification code is: ${code}. Expires in 10 minutes.`;
  return sendEmail(toEmail, subject, html, text);
}

export async function sendPasswordResetCode(toEmail: string, code: string, name: string): Promise<boolean> {
  const subject = `${code} is your LSPTicketHive password reset code`;
  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:400px;margin:0 auto;padding:40px 20px;text-align:center;">
      <h2 style="color:#22c55e;margin-bottom:8px;">LSPTicketHive</h2>
      <p style="color:#666;margin-bottom:24px;">Hi ${name}, use this code to reset your password.</p>
      <div style="background:#f5f5f5;border-radius:12px;padding:24px;margin-bottom:24px;">
        <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111;">${code}</span>
      </div>
      <p style="color:#999;font-size:13px;">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
    </div>`;
  const text = `Your LSPTicketHive password reset code is: ${code}. Expires in 15 minutes. If you didn't request this, ignore this email.`;
  return sendEmail(toEmail, subject, html, text);
}

export async function sendNewEventNotification(
  toEmail: string,
  attendeeName: string,
  organizerName: string,
  eventTitle: string,
  eventId: string,
  eventDate: string,
  venue: string
) {
  const subject = `${organizerName} just posted a new event: ${eventTitle}`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="background: #22c55e; color: #000; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 14px;">LSPTicketHive</span>
      </div>
      <h1 style="color: #fff; font-size: 24px; margin-bottom: 8px;">New Event from ${organizerName}</h1>
      <p style="color: #9ca3af; font-size: 14px; margin-bottom: 24px;">Hi ${attendeeName}, an organizer you follow just posted a new event.</p>
      <div style="background: #1a1a2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h2 style="color: #fff; font-size: 20px; margin: 0 0 8px 0;">${eventTitle}</h2>
        <p style="color: #9ca3af; font-size: 14px; margin: 4px 0;">📅 ${eventDate}</p>
        ${venue ? `<p style="color: #9ca3af; font-size: 14px; margin: 4px 0;">📍 ${venue}</p>` : ""}
      </div>
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/events/${eventId}" style="background: #22c55e; color: #000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View Event & Get Tickets</a>
      </div>
      <p style="color: #4b5563; font-size: 12px; text-align: center; margin-top: 30px;">You received this because you follow ${organizerName} on LSPTicketHive.</p>
    </div>`;

  const textBody = `${organizerName} just posted: ${eventTitle}\n${eventDate}${venue ? ` at ${venue}` : ""}\n\nView: ${FRONTEND_URL}/events/${eventId}`;

  return sendEmail(toEmail, subject, htmlBody, textBody);
}
