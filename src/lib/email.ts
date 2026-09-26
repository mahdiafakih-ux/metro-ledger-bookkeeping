import { Resend } from "resend";

let client: Resend | null = null;
let attempted = false;

function getResendClient(): Resend | null {
  if (attempted) return client;
  attempted = true;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = new Resend(key);
  return client;
}

export function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

const FROM_EMAIL = () => process.env.RESEND_FROM_EMAIL || "Notar-E Services <hello@notareservices.com>";

const NAVY = "#0a1128";
const ACCENT = "#3b6bff";

/**
 * Wraps email body content in a branded, table-based HTML layout that
 * renders consistently across email clients (inline styles only — no
 * external stylesheet, no JS).
 */
function emailLayout(preheader: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Notar-E Services</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fc; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e3e7f4;">
            <tr>
              <td style="background-color:${NAVY}; padding:24px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:10px;">
                      <div style="width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#131F3D,#050914); text-align:center; line-height:36px; font-weight:800; color:#ffffff; font-size:16px;">N</div>
                    </td>
                    <td>
                      <span style="color:#ffffff; font-size:18px; font-weight:700;">Notar-E</span>
                      <span style="color:${ACCENT}; font-size:18px; font-weight:700;"> Services</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; background-color:#f4f6fc; border-top:1px solid #e3e7f4;">
                <p style="margin:0; font-size:11px; line-height:1.6; color:#94a1c4;">
                  Notar-E Services is not a law firm and does not provide legal advice. Statutory
                  notarial fees are limited to $10 per notarial act under Michigan law (MCL 55.285);
                  any other charges are for separately-disclosed, lawful business services.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(url: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;"><tr><td style="border-radius:8px; background-color:${ACCENT};"><a href="${url}" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none;">${label}</a></td></tr></table>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 16px; font-size:22px; font-weight:800; color:${NAVY};">${text}</h1>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#3a5089;">${text}</p>`;
}

function detailsBox(rows: Array<[string, string]>) {
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0; font-size:13px; color:#64749f;">${label}</td><td style="padding:6px 0; font-size:13px; font-weight:600; color:${NAVY}; text-align:right;">${value}</td></tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fc; border-radius:10px; padding:16px; margin: 0 0 16px;"><tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table></td></tr></table>`;
}

interface SendResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

// Only needed for templates that interpolate free-text customer input
// (e.g. booking notes) rather than values already constrained by a schema
// enum or our own formatting.
function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  const resend = getResendClient();
  if (!resend || !to) {
    return { success: true, skipped: true };
  }
  try {
    await resend.emails.send({ from: FROM_EMAIL(), to, subject, html });
    return { success: true };
  } catch (err) {
    console.error("Resend send failed:", err instanceof Error ? err.message : err);
    return { success: false, error: err instanceof Error ? err.message : "Email send failed" };
  }
}

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function sendBookingConfirmationEmail(input: {
  to: string;
  name: string;
  appointmentId: string;
  confirmationNumber: string;
  serviceType: string;
  type: string;
  scheduledStart: Date;
  totalCents: number;
}) {
  const dateStr = input.scheduledStart.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  const html = emailLayout(
    `Your appointment is confirmed for ${dateStr}`,
    `${heading("You're booked!")}
     ${paragraph(`Hi ${input.name}, your Notar-E Services appointment is confirmed. Please bring valid, government-issued photo ID.`)}
     ${detailsBox([
       ["Confirmation #", input.confirmationNumber],
       ["Service", input.serviceType],
       ["Type", input.type === "remote" ? "Remote / Online" : "In-Person"],
       ["Date & Time", dateStr],
       ["Total Due", `$${(input.totalCents / 100).toFixed(2)}`],
     ])}
     ${button(`${siteUrl()}/book/confirmation/${input.appointmentId}`, "View & Pay Online")}
     ${paragraph("Availability was not guaranteed until this confirmation was sent — you're all set now. Reply to this email if you need to make any changes.")}`
  );
  return send(input.to, `Appointment Confirmed — ${input.confirmationNumber}`, html);
}

export async function sendAppointmentReminderEmail(input: {
  to: string;
  name: string;
  appointmentId: string;
  confirmationNumber: string;
  serviceType: string;
  scheduledStart: Date;
}) {
  const dateStr = input.scheduledStart.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  const html = emailLayout(
    `Reminder: your appointment is coming up`,
    `${heading("Appointment Reminder")}
     ${paragraph(`Hi ${input.name}, this is a friendly reminder about your upcoming Notar-E Services appointment.`)}
     ${detailsBox([
       ["Confirmation #", input.confirmationNumber],
       ["Service", input.serviceType],
       ["Date & Time", dateStr],
     ])}
     ${paragraph("Please have valid, government-issued photo ID ready. If you need to reschedule, just reply to this email.")}
     ${button(`${siteUrl()}/book/confirmation/${input.appointmentId}`, "View Appointment")}`
  );
  return send(input.to, `Reminder: Your appointment is ${dateStr}`, html);
}

export async function sendAppointmentChangedEmail(input: {
  to: string;
  name: string;
  appointmentId: string;
  confirmationNumber: string;
  serviceType: string;
  scheduledStart: Date;
}) {
  const dateStr = input.scheduledStart.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  const html = emailLayout(
    `Your appointment details have changed`,
    `${heading("Appointment Updated")}
     ${paragraph(`Hi ${input.name}, your Notar-E Services appointment has been updated. Here are the current details:`)}
     ${detailsBox([
       ["Confirmation #", input.confirmationNumber],
       ["Service", input.serviceType],
       ["New Date & Time", dateStr],
     ])}
     ${button(`${siteUrl()}/book/confirmation/${input.appointmentId}`, "View Appointment")}`
  );
  return send(input.to, `Appointment Updated — ${input.confirmationNumber}`, html);
}

export async function sendAppointmentCancelledEmail(input: {
  to: string;
  name: string;
  confirmationNumber: string;
  serviceType: string;
  scheduledStart: Date;
}) {
  const dateStr = input.scheduledStart.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  const html = emailLayout(
    `Your appointment has been cancelled`,
    `${heading("Appointment Cancelled")}
     ${paragraph(`Hi ${input.name}, your Notar-E Services appointment below has been cancelled.`)}
     ${detailsBox([
       ["Confirmation #", input.confirmationNumber],
       ["Service", input.serviceType],
       ["Was Scheduled For", dateStr],
     ])}
     ${paragraph(`Need to rebook? <a href="${siteUrl()}/book" style="color:${ACCENT};">Book a new appointment</a> anytime.`)}`
  );
  return send(input.to, `Appointment Cancelled — ${input.confirmationNumber}`, html);
}

export async function sendPaymentReceiptEmail(input: {
  to: string;
  name: string;
  amountCents: number;
  description: string;
  method: string;
}) {
  const html = emailLayout(
    `Payment received — thank you!`,
    `${heading("Payment Receipt")}
     ${paragraph(`Hi ${input.name}, thank you — we've received your payment.`)}
     ${detailsBox([
       ["Amount", `$${(input.amountCents / 100).toFixed(2)}`],
       ["For", input.description],
       ["Method", input.method === "stripe" ? "Card (Stripe)" : input.method.charAt(0).toUpperCase() + input.method.slice(1)],
       ["Date", new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
     ])}
     ${paragraph("Keep this email as your receipt. Reach out if you have any questions.")}`
  );
  return send(input.to, "Payment Receipt — Notar-E Services", html);
}

export async function sendInvoiceEmail(input: {
  to: string;
  name: string;
  invoiceId: string;
  invoiceNumber: string;
  totalCents: number;
  dueDate: Date;
}) {
  const html = emailLayout(
    `Invoice ${input.invoiceNumber} from Notar-E Services`,
    `${heading(`Invoice ${input.invoiceNumber}`)}
     ${paragraph(`Hi ${input.name}, please find your invoice from Notar-E Services below.`)}
     ${detailsBox([
       ["Invoice #", input.invoiceNumber],
       ["Amount Due", `$${(input.totalCents / 100).toFixed(2)}`],
       ["Due Date", input.dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
     ])}
     ${button(`${siteUrl()}/invoice/${input.invoiceId}`, "View & Pay Invoice")}
     ${paragraph("This invoice separates the Michigan statutory notarial fee from other lawful service charges, itemized on the invoice page.")}`
  );
  return send(input.to, `Invoice ${input.invoiceNumber} — Notar-E Services`, html);
}

/**
 * Notifies the business owner (BOOKING_NOTIFICATION_EMAIL) whenever a
 * customer successfully books online. Sent after the appointment row is
 * already committed to the database — never a condition for the booking
 * to succeed. Silently skipped (not an error) if either RESEND_API_KEY or
 * BOOKING_NOTIFICATION_EMAIL isn't configured.
 */
export async function sendBookingNotificationEmail(input: {
  appointmentId: string;
  confirmationNumber: string;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  type: string;
  scheduledStart: Date;
  address?: string;
  notes?: string;
}) {
  const ownerEmail = process.env.BOOKING_NOTIFICATION_EMAIL;
  if (!ownerEmail) return { success: true, skipped: true } as const;

  const dateStr = input.scheduledStart.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeStr = input.scheduledStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const locationStr = input.type === "remote" ? "Remote / Online" : escapeHtml(input.address || "In-person (no address provided)");

  const rows: Array<[string, string]> = [
    ["Customer Name", escapeHtml(input.name)],
    ["Customer Email", escapeHtml(input.email)],
    ["Customer Phone", escapeHtml(input.phone || "—")],
    ["Service", escapeHtml(input.serviceType)],
    ["Appointment Date", dateStr],
    ["Appointment Time", timeStr],
    ["Location", locationStr],
    ["Appointment ID", input.appointmentId],
    ["Confirmation #", input.confirmationNumber],
  ];

  const html = emailLayout(
    `New booking from ${escapeHtml(input.name)} — ${dateStr} at ${timeStr}`,
    `${heading("New Appointment Booked")}
     ${paragraph(`A customer just booked online. Details below.`)}
     ${detailsBox(rows)}
     ${input.notes ? paragraph(`<strong>Customer notes:</strong> ${escapeHtml(input.notes)}`) : ""}
     ${button(`${siteUrl()}/admin/appointments/${input.appointmentId}`, "View in Command Center")}`
  );

  return send(ownerEmail, `New Booking — ${input.name} (${dateStr})`, html);
}

export async function sendBusinessLeadConfirmationEmail(input: { to: string; name: string; company?: string }) {
  const html = emailLayout(
    `Thanks for reaching out to Notar-E Services`,
    `${heading("We got your message!")}
     ${paragraph(`Hi ${input.name}, thank you for your interest in Notar-E Services${input.company ? ` on behalf of ${input.company}` : ""}. Our team will reach out within one business day to discuss your notary needs and recommend the right plan.`)}
     ${paragraph("In the meantime, feel free to explore our business solutions and pricing.")}
     ${button(`${siteUrl()}/business-solutions`, "View Business Solutions")}`
  );
  return send(input.to, "Thanks for reaching out to Notar-E Services", html);
}

export async function sendLoginCodeEmail(input: { to: string; name: string; code: string }) {
  const html = emailLayout(
    `Your Notar-E Client Portal Access Code`,
    `${heading("Your Access Code")}\n     ${paragraph(`Hi ${escapeHtml(input.name)}, here is your 6-digit access code:`)}\n     ${detailsBox([["Access Code", `<strong style="font-size: 24px; font-family: monospace; letter-spacing: 2px;">${input.code}</strong>`]])}\n     ${paragraph("This code expires in 15 minutes. If you didn't request this code, you can ignore this email.")}\n     ${button(`${siteUrl()}/portal/login`, "Go to Portal")}`
  );
  return send(input.to, "Your Notar-E Portal Access Code", html);
}

export async function sendCareerApplicationNotificationEmail(input: {
  applicationId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  commissioned: boolean;
}) {
  const ownerEmail = process.env.BOOKING_NOTIFICATION_EMAIL;
  if (!ownerEmail) return { success: true, skipped: true } as const;
  // Deliberately no resume attachment or free-text message — the full
  // application stays behind admin login.
  const html = emailLayout(
    `New career application from ${escapeHtml(input.name)}`,
    `${heading("New Career Application")}
     ${detailsBox([
       ["Name", escapeHtml(input.name)],
       ["Role", escapeHtml(input.role)],
       ["Location", escapeHtml(input.location)],
       ["Commissioned notary", input.commissioned ? "Yes" : "No"],
       ["Email", escapeHtml(input.email)],
       ["Phone", escapeHtml(input.phone)],
     ])}
     ${button(`${siteUrl()}/admin/careers/${input.applicationId}`, "Review in Command Center")}`
  );
  return send(ownerEmail, `New Application — ${input.name} (${input.role})`, html);
}

export async function sendCareerApplicationReceivedEmail(input: { to: string; firstName: string }) {
  const html = emailLayout(
    `Thanks for your interest in Notar-E Services`,
    `${heading("Application received")}
     ${paragraph(`Hi ${escapeHtml(input.firstName)}, thanks for your interest in joining the Notar-E network. We review every application and will reach out if there's a fit.`)}`
  );
  return send(input.to, "We received your application — Notar-E Services", html);
}
