import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION || "eu-west-1" });
const FROM_EMAIL = process.env.FROM_EMAIL || "mansaraysamuellamin001@gmail.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://lsptickethive.com";

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
    </div>
  `;

  const textBody = `${organizerName} just posted: ${eventTitle}\n${eventDate}${venue ? ` at ${venue}` : ""}\n\nView: ${FRONTEND_URL}/events/${eventId}`;

  try {
    await ses.send(new SendEmailCommand({
      Source: `LSPTicketHive <${FROM_EMAIL}>`,
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: htmlBody },
          Text: { Data: textBody },
        },
      },
    }));
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}
