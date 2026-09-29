// Post-booking hook: tells the owner's private AI operator about a new
// booking. Called only after the booking transaction has committed.
//
// Today this is a safe no-op: no outbound Vapi call is made unless the owner
// explicitly enables it AND every required setting is present:
//
//   VAPI_OWNER_CALLS_ENABLED="true"
//   VAPI_API_KEY               (server-only, never sent to the browser)
//   VAPI_ASSISTANT_ID          (the private operator assistant)
//   VAPI_PHONE_NUMBER_ID       (Vapi phone number that places the call)
//   OWNER_PHONE_NUMBER         (E.164, e.g. +13135550100)
//
// This function never throws — a notification problem must never affect a
// customer's booking.

export interface BookingNotification {
  appointmentId: string;
  confirmationNumber: string;
  clientName: string;
  service: string;
  appointmentType: string;
  scheduledStart: Date;
  paymentStatus: string;
  totalCents: number;
  /** Only for in-person (mobile) appointments. */
  location?: string;
}

export interface VapiOwnerCallConfig {
  apiKey: string;
  assistantId: string;
  phoneNumberId: string;
  ownerNumber: string;
}

/** Returns the call config only when owner calls are explicitly enabled and fully configured. */
export function getVapiOwnerCallConfig(env: Record<string, string | undefined> = process.env): VapiOwnerCallConfig | null {
  if (env.VAPI_OWNER_CALLS_ENABLED !== "true") return null;
  const apiKey = env.VAPI_API_KEY?.trim();
  const assistantId = env.VAPI_ASSISTANT_ID?.trim();
  const phoneNumberId = env.VAPI_PHONE_NUMBER_ID?.trim();
  const ownerNumber = env.OWNER_PHONE_NUMBER?.trim();
  if (!apiKey || !assistantId || !phoneNumberId || !ownerNumber) return null;
  if (!/^\+[1-9]\d{7,14}$/.test(ownerNumber)) return null;
  return { apiKey, assistantId, phoneNumberId, ownerNumber };
}

/** Variables handed to the assistant — the minimum needed to brief the owner. */
export function bookingCallVariables(b: BookingNotification) {
  const when = b.scheduledStart.toLocaleString("en-US", {
    timeZone: "America/Detroit",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return {
    event: "new_booking",
    appointmentId: b.appointmentId,
    confirmationNumber: b.confirmationNumber,
    clientName: b.clientName,
    service: b.service,
    appointmentType: b.appointmentType === "remote" ? "remote" : "in person",
    scheduledFor: when,
    paymentStatus: b.paymentStatus,
    amount: (b.totalCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }),
    location: b.appointmentType === "in_person" && b.location ? b.location.slice(0, 200) : "",
  };
}

export async function notifyOperatorOfBooking(booking: BookingNotification): Promise<void> {
  try {
    const config = getVapiOwnerCallConfig();
    if (!config) return; // Not enabled/configured — intentional no-op.

    const res = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        assistantId: config.assistantId,
        phoneNumberId: config.phoneNumberId,
        customer: { number: config.ownerNumber },
        assistantOverrides: { variableValues: bookingCallVariables(booking) },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`Operator booking call failed: HTTP ${res.status} for ${booking.confirmationNumber}`);
    }
  } catch (err) {
    console.error(
      `Operator booking notification error for ${booking.confirmationNumber}:`,
      err instanceof Error ? err.message.slice(0, 200) : "unknown error"
    );
  }
}
