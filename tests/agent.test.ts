// Private AI operator API — pure logic tests (no database).
// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { isAgentRequestAuthorized } from "../src/lib/agent/auth";
import { customRange, periodRange } from "../src/lib/agent/periods";
import { AGENT_ACTIONS, appendNote, validateAgentAction } from "../src/lib/agent/action-rules";
import { bookingCallVariables, getVapiOwnerCallConfig } from "../src/lib/agent/booking-notification";
import { parseLimit, phoneDigits } from "../src/lib/agent/respond";
import { mergeById, phoneMatches } from "../src/lib/agent/search";

const KEY = "s3cret-key-value";

test("agent auth: accepts only the exact bearer token", () => {
  assert.equal(isAgentRequestAuthorized(`Bearer ${KEY}`, KEY), true);
  assert.equal(isAgentRequestAuthorized(`bearer ${KEY}`, KEY), true); // scheme is case-insensitive
  assert.equal(isAgentRequestAuthorized(`Bearer ${KEY}x`, KEY), false);
  assert.equal(isAgentRequestAuthorized(`Bearer ${KEY.slice(0, -1)}`, KEY), false);
  assert.equal(isAgentRequestAuthorized(KEY, KEY), false); // missing scheme
  assert.equal(isAgentRequestAuthorized(`Basic ${KEY}`, KEY), false);
  assert.equal(isAgentRequestAuthorized("Bearer ", KEY), false);
  assert.equal(isAgentRequestAuthorized(null, KEY), false);
});

test("agent auth: fails closed when the key is not configured", () => {
  assert.equal(isAgentRequestAuthorized("Bearer ", undefined), false);
  assert.equal(isAgentRequestAuthorized("Bearer anything", undefined), false);
  assert.equal(isAgentRequestAuthorized("Bearer anything", ""), false);
});

test("periods: Detroit month/week/today boundaries", () => {
  // 2026-09-29 11:45 EDT = 15:45Z
  const now = new Date("2026-09-29T15:45:00Z");
  const month = periodRange("month", now);
  assert.equal(month.start?.toISOString(), "2026-09-01T04:00:00.000Z");
  assert.equal(month.end?.toISOString(), "2026-10-01T04:00:00.000Z");
  const week = periodRange("week", now); // Sunday Sep 27
  assert.equal(week.start?.toISOString(), "2026-09-27T04:00:00.000Z");
  assert.equal(week.end?.toISOString(), "2026-10-04T04:00:00.000Z");
  const today = periodRange("today", now);
  assert.equal(today.start?.toISOString(), "2026-09-29T04:00:00.000Z");
  const all = periodRange("all", now);
  assert.equal(all.start, null);
  // Late evening Detroit time is still "today" in Detroit even though UTC has rolled over.
  const lateNight = periodRange("today", new Date("2026-09-30T02:30:00Z"));
  assert.equal(lateNight.start?.toISOString(), "2026-09-29T04:00:00.000Z");
});

test("periods: custom ranges are validated and bounded", () => {
  const r = customRange("2026-01-01", "2026-01-31");
  assert.ok(!("error" in r));
  assert.equal(r.start?.toISOString(), "2026-01-01T05:00:00.000Z"); // EST
  assert.equal(r.end?.toISOString(), "2026-02-01T05:00:00.000Z");
  assert.ok("error" in customRange("2026-02-01", "2026-01-01"));
  assert.ok("error" in customRange("2026-13-01", "2026-12-01"));
  assert.ok("error" in customRange("2024-01-01", "2026-01-01"));
});

test("actions: unsupported and dangerous actions are rejected", () => {
  for (const action of ["delete_client", "refund_payment", "update_pricing", "raw_sql", "__proto__", "toString"]) {
    const v = validateAgentAction({ action, targetId: "abc123", data: {} });
    assert.equal(v.ok, false, action);
    if (!v.ok) assert.match(v.error, /Unsupported action/);
  }
  assert.equal(Object.keys(AGENT_ACTIONS).length, 7);
});

test("actions: envelope and data are strictly validated", () => {
  assert.equal(validateAgentAction(null).ok, false);
  assert.equal(validateAgentAction({ action: "update_client_notes", targetId: "bad id!", data: { notes: "x" } }).ok, false);
  // Extra fields in data are rejected — no arbitrary column writes.
  const extra = validateAgentAction({
    action: "update_client_notes",
    targetId: "c1",
    data: { notes: "hello", amountOwedCents: 0 },
  });
  assert.equal(extra.ok, false);
  const badStatus = validateAgentAction({ action: "update_appointment_status", targetId: "a1", data: { status: "deleted" } });
  assert.equal(badStatus.ok, false);
  const tooLong = validateAgentAction({ action: "update_client_notes", targetId: "c1", data: { notes: "x".repeat(2001) } });
  assert.equal(tooLong.ok, false);
});

test("actions: confirmation rules", () => {
  const now = new Date("2026-09-29T15:45:00Z");
  const status = validateAgentAction({ action: "update_appointment_status", targetId: "NE-ABC", data: { status: "completed" } }, now);
  assert.ok(status.ok && status.needsConfirmation && !status.confirmed);

  const append = validateAgentAction({ action: "update_client_notes", targetId: "c1", data: { notes: "Called, left VM" } }, now);
  assert.ok(append.ok && !append.needsConfirmation);

  const replace = validateAgentAction({ action: "update_client_notes", targetId: "c1", data: { notes: "x", mode: "replace" } }, now);
  assert.ok(replace.ok && replace.needsConfirmation);

  const setFollow = validateAgentAction({ action: "set_business_follow_up", targetId: "b1", data: { date: "2026-10-05" } }, now);
  assert.ok(setFollow.ok && !setFollow.needsConfirmation);

  const clearFollow = validateAgentAction({ action: "set_business_follow_up", targetId: "b1", data: { date: null }, confirmed: true }, now);
  assert.ok(clearFollow.ok && clearFollow.needsConfirmation && clearFollow.confirmed);
});

test("actions: follow-up dates use the Detroit calendar and reject the past", () => {
  const now = new Date("2026-09-30T02:30:00Z"); // Sep 29, 10:30 PM in Detroit
  assert.equal(validateAgentAction({ action: "set_client_follow_up", targetId: "c1", data: { date: "2026-09-29" } }, now).ok, true);
  assert.equal(validateAgentAction({ action: "set_client_follow_up", targetId: "c1", data: { date: "2026-09-28" } }, now).ok, false);
  assert.equal(validateAgentAction({ action: "set_client_follow_up", targetId: "c1", data: { date: "2031-01-01" } }, now).ok, false);
  assert.equal(validateAgentAction({ action: "set_client_follow_up", targetId: "c1", data: { date: "10/05/2026" } }, now).ok, false);
});

test("appendNote keeps existing notes and dates the entry", () => {
  assert.equal(appendNote("", "First", "2026-09-29"), "[2026-09-29 · AI operator] First");
  assert.equal(appendNote("Old note  ", "New", "2026-09-29"), "Old note\n\n[2026-09-29 · AI operator] New");
});

test("booking hook: stays disabled unless explicitly enabled and fully configured", () => {
  const full = {
    VAPI_OWNER_CALLS_ENABLED: "true",
    VAPI_API_KEY: "k",
    VAPI_ASSISTANT_ID: "a",
    VAPI_PHONE_NUMBER_ID: "p",
    OWNER_PHONE_NUMBER: "+13135550100",
  };
  assert.ok(getVapiOwnerCallConfig(full));
  assert.equal(getVapiOwnerCallConfig({ ...full, VAPI_OWNER_CALLS_ENABLED: "false" }), null);
  assert.equal(getVapiOwnerCallConfig({ ...full, VAPI_API_KEY: "" }), null);
  assert.equal(getVapiOwnerCallConfig({ ...full, OWNER_PHONE_NUMBER: "313-555-0100" }), null);
  assert.equal(getVapiOwnerCallConfig({}), null);
});

test("booking hook: call variables carry only what the owner needs", () => {
  const vars = bookingCallVariables({
    appointmentId: "appt1",
    confirmationNumber: "NE-TEST1",
    clientName: "Jane Doe",
    service: "General Notary",
    appointmentType: "remote",
    scheduledStart: new Date("2026-10-01T13:00:00Z"),
    paymentStatus: "unpaid",
    totalCents: 15000,
    location: "123 Main St",
  });
  assert.equal(vars.amount, "$150.00");
  assert.equal(vars.location, ""); // remote → no address
  assert.match(vars.scheduledFor, /Thursday, October 1.*9:00/);
  assert.equal("email" in vars || "phone" in vars, false);
});

test("search helpers", () => {
  assert.equal(phoneDigits("(313) 555-0142"), "3135550142");
  assert.equal(phoneDigits("John"), null);
  assert.equal(phoneMatches("(313) 555-0142", "5550142"), true);
  assert.equal(phoneMatches("(313) 555-0142", "5550143"), false);
  assert.deepEqual(mergeById(3, [{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }, { id: "d" }]).map((r) => r.id), ["a", "b", "c"]);
  assert.equal(parseLimit("500", 10, 25), 25);
  assert.equal(parseLimit("abc", 10, 25), 10);
  assert.equal(parseLimit("0", 10, 25), 1);
});
