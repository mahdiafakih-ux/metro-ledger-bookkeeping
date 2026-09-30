// create_appointment (voice booking) — pure logic tests with injected fakes.
// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAgentAction } from "../src/lib/agent/action-rules";
import { normalizeTime, voiceDateTime } from "../src/lib/agent/booking-input";
import {
  nearestAlternatives,
  runCreateAppointment,
  type CreateAppointmentDeps,
  type ExistingAppointment,
} from "../src/lib/agent/create-appointment";
import type { BookingInput } from "../src/lib/validation";

// Tue 2026-09-29 11:45 EDT
const NOW = new Date("2026-09-29T15:45:00Z");

const VALID = {
  clientName: "Jane Doe",
  email: "jane@example.com",
  phone: "(313) 555-0100",
  service: "power of attorney",
  appointmentType: "mobile",
  date: "2026-10-01",
  time: "2:30 PM",
  documentType: "Durable POA",
  numberOfActs: 2,
  address: "123 Michigan Ave, Dearborn, MI",
};

function create(data: Record<string, unknown>, confirmed = false, extra: Record<string, unknown> = {}) {
  return validateAgentAction({ action: "create_appointment", data, confirmed, ...extra }, NOW);
}

function validated(data = VALID) {
  const v = create(data, true);
  assert.ok(v.ok, v.ok ? "" : v.error);
  assert.equal(v.payload.kind, "create");
  if (v.payload.kind !== "create") throw new Error("unreachable");
  return v.payload.data;
}

function fakeDeps(opts: { slots?: string[]; duplicate?: ExistingAppointment | null; raceDuplicate?: ExistingAppointment; slotTaken?: boolean } = {}) {
  const calls = { create: [] as BookingInput[], findDuplicate: 0 };
  const deps: CreateAppointmentDeps = {
    getOpenSlots: async () =>
      (opts.slots ?? ["14:00", "14:30", "15:00"]).map((v) => ({ value: v, label: v })),
    findDuplicate: async () => {
      calls.findDuplicate++;
      if (calls.findDuplicate > 1 && opts.raceDuplicate) return opts.raceDuplicate;
      return opts.duplicate ?? null;
    },
    quote: async (acts) => ({ statutoryFeeCents: acts * 1000, serviceFeeCents: 14000, totalCents: acts * 1000 + 14000 }),
    createBooking: async (booking) => {
      calls.create.push(booking);
      if (opts.slotTaken) return { success: false, error: "taken", slotTaken: true };
      return { success: true, appointmentId: "appt_1", confirmationNumber: "NE-ABC123", pricing: { statutoryFeeCents: 2000, serviceFeeCents: 14000, totalCents: 16000 } };
    },
  };
  return { deps, calls };
}

test("create_appointment is allowlisted and always needs confirmation", () => {
  const v = create(VALID, false);
  assert.ok(v.ok);
  assert.equal(v.needsConfirmation, true);
  assert.equal(v.confirmed, false);
  assert.equal(v.targetType, "appointment");
});

test("input is normalised to the public booking shape", () => {
  const { booking, start } = validated();
  assert.equal(booking.appointmentType, "in_person");
  assert.equal(booking.serviceType, "Power of Attorney");
  assert.equal(booking.time, "14:30");
  assert.equal(booking.name, "Jane Doe");
  assert.equal(booking.numberOfActs, 2);
  assert.equal(start.toISOString(), "2026-10-01T18:30:00.000Z"); // 2:30 PM EDT
});

test("1. confirmed=false creates nothing and returns a read-back prompt", async () => {
  const { booking, start } = validated();
  const { deps, calls } = fakeDeps();
  const out = await runCreateAppointment(booking, start, false, deps);
  assert.equal(out.kind, "needs_confirmation");
  assert.equal(calls.create.length, 0);
  if (out.kind === "needs_confirmation") {
    assert.match(out.prompt, /Book Jane Doe for Power of Attorney/);
    assert.match(out.prompt, /Thursday, October 1 at 2:30 PM/);
    assert.match(out.prompt, /\$160\.00, unpaid/);
    assert.equal(out.preview.paymentStatus, "unpaid");
  }
});

test("2. confirmed valid appointment is created once via the booking core", async () => {
  const { booking, start } = validated();
  const { deps, calls } = fakeDeps();
  const out = await runCreateAppointment(booking, start, true, deps);
  assert.equal(out.kind, "created");
  assert.equal(calls.create.length, 1);
  assert.deepEqual(calls.create[0], booking);
  if (out.kind === "created") {
    assert.equal(out.appointment.appointmentId, "appt_1");
    assert.equal(out.appointment.confirmationNumber, "NE-ABC123");
    assert.equal(out.appointment.status, "scheduled");
    assert.equal(out.appointment.paymentStatus, "unpaid");
    assert.equal(out.appointment.scheduledFor, "Thursday, October 1 at 2:30 PM");
  }
});

test("3. unavailable slot is rejected with nearby open times, nothing created", async () => {
  const { booking, start } = validated();
  for (const confirmed of [false, true]) {
    const { deps, calls } = fakeDeps({ slots: ["09:00", "13:30", "15:30", "18:00"] });
    const out = await runCreateAppointment(booking, start, confirmed, deps);
    assert.equal(out.kind, "unavailable");
    assert.equal(calls.create.length, 0);
    if (out.kind === "unavailable") assert.deepEqual(out.alternatives, ["13:30", "15:30", "18:00"]);
  }
  const { deps } = fakeDeps({ slots: [] });
  const none = await runCreateAppointment(booking, start, true, deps);
  assert.ok(none.kind === "unavailable" && /no open times/.test(none.message));
});

test("4. past date/time is rejected", () => {
  const today = create({ ...VALID, date: "2026-09-29", time: "9:00 AM" }, true);
  assert.equal(today.ok, false);
  if (!today.ok) assert.match(today.error, /in the past/);
  assert.equal(create({ ...VALID, date: "2026-09-01" }, true).ok, false);
});

test("5. malformed input is rejected", () => {
  const cases: [Record<string, unknown>, RegExp][] = [
    [{ ...VALID, email: "not-an-email" }, /email/],
    [{ ...VALID, email: undefined }, /email/],
    [{ ...VALID, phone: "123" }, /phone/],
    [{ ...VALID, address: "" }, /address is required/],
    [{ ...VALID, service: "Wedding officiant" }, /Unknown service/],
    [{ ...VALID, appointmentType: "drive-thru" }, /appointmentType/],
    [{ ...VALID, date: "10/01/2026" }, /date must be/],
    [{ ...VALID, date: "2026-02-30" }, /date must be/],
    [{ ...VALID, time: "25:00" }, /time must be/],
    [{ ...VALID, time: "noonish" }, /time must be/],
    [{ ...VALID, numberOfActs: 0 }, /numberOfActs/],
    [{ ...VALID, numberOfActs: 21 }, /numberOfActs/],
    [{ ...VALID, documentType: "" }, /documentType/],
    [{ ...VALID, clientName: "J" }, /clientName/],
    [{ ...VALID, paymentStatus: "paid" }, /Unrecognized key/],
    [{ ...VALID, totalAmountCents: 0 }, /Unrecognized key/],
  ];
  for (const [data, re] of cases) {
    const v = create(data, true);
    assert.equal(v.ok, false, JSON.stringify(data));
    if (!v.ok) assert.match(v.error, re, JSON.stringify(data));
  }
  // A real targetId is refused; an empty one (voice tools send every field) is ignored.
  assert.equal(create(VALID, true, { targetId: "appt_1" }).ok, false);
  assert.equal(create(VALID, true, { targetId: "" }).ok, true);
});

test("remote appointments need no address and drop any given", () => {
  const v = create({ ...VALID, appointmentType: "online", address: "" }, true);
  assert.ok(v.ok && v.payload.kind === "create");
  if (v.ok && v.payload.kind === "create") assert.equal(v.payload.data.booking.address, "");
  const w = create({ ...VALID, appointmentType: "remote" }, true);
  if (w.ok && w.payload.kind === "create") assert.equal(w.payload.data.booking.address, "");
});

test("6. unsupported actions are still rejected", () => {
  for (const action of ["delete_appointment", "create_client", "create_invoice", "refund_payment", "charge_card", "book_and_pay"]) {
    const v = validateAgentAction({ action, data: {} }, NOW);
    assert.equal(v.ok, false);
    if (!v.ok) assert.match(v.error, /Unsupported action/);
  }
});

test("7. cancellation still requires confirmation, by id or confirmation number", () => {
  for (const targetId of ["cm123abc", "NE-ABC123"]) {
    const v = validateAgentAction({ action: "update_appointment_status", targetId, data: { status: "cancelled" } }, NOW);
    assert.ok(v.ok && v.needsConfirmation && !v.confirmed);
  }
  assert.equal(validateAgentAction({ action: "update_appointment_status", data: { status: "cancelled" }, confirmed: true }, NOW).ok, false);
});

test("9. existing targeted actions still validate as before", () => {
  const note = validateAgentAction({ action: "update_client_notes", targetId: "c1", data: { notes: "Called back" } }, NOW);
  assert.ok(note.ok && !note.needsConfirmation);
  assert.equal(validateAgentAction({ action: "update_client_notes", data: { notes: "x" } }, NOW).ok, false); // targetId required
});

test("duplicate: a repeated request returns the existing appointment, nothing new", async () => {
  const { booking, start } = validated();
  const existing: ExistingAppointment = {
    id: "appt_old",
    confirmationNumber: "NE-OLD1",
    clientName: "Jane Doe",
    serviceType: "Power of Attorney",
    type: "in_person",
    status: "scheduled",
    scheduledStart: start,
  };
  for (const confirmed of [false, true]) {
    const { deps, calls } = fakeDeps({ duplicate: existing });
    const out = await runCreateAppointment(booking, start, confirmed, deps);
    assert.equal(out.kind, "duplicate");
    assert.equal(calls.create.length, 0);
    if (out.kind === "duplicate") assert.equal(out.appointment.confirmationNumber, "NE-OLD1");
  }
});

test("duplicate: a concurrent retry that wins the slot is reported, not double-booked", async () => {
  const { booking, start } = validated();
  const raced: ExistingAppointment = {
    id: "appt_race",
    confirmationNumber: "NE-RACE",
    clientName: "Jane Doe",
    serviceType: "Power of Attorney",
    type: "in_person",
    status: "scheduled",
    scheduledStart: start,
  };
  const { deps, calls } = fakeDeps({ slotTaken: true, raceDuplicate: raced });
  const out = await runCreateAppointment(booking, start, true, deps);
  assert.equal(calls.create.length, 1);
  assert.equal(out.kind, "duplicate");

  const { deps: deps2 } = fakeDeps({ slotTaken: true });
  const taken = await runCreateAppointment(booking, start, true, deps2);
  assert.equal(taken.kind, "unavailable");
});

test("time parsing and voice formatting", () => {
  assert.equal(normalizeTime("9am"), "09:00");
  assert.equal(normalizeTime("9:00 a.m."), "09:00");
  assert.equal(normalizeTime("12 PM"), "12:00");
  assert.equal(normalizeTime("12:15 am"), "00:15");
  assert.equal(normalizeTime("7:05"), "07:05");
  assert.equal(normalizeTime("13 pm"), null);
  assert.equal(voiceDateTime(new Date("2026-12-15T15:00:00Z")), "Tuesday, December 15 at 10:00 AM"); // EST
  assert.deepEqual(nearestAlternatives([], "10:00"), []);
});
