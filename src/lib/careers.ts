import { z } from "zod";

/** Areas people can apply for / express interest in. Client-safe. */
export const CAREER_ROLES = [
  { key: "commissioned_notary", label: "Commissioned Notary", short: "Notarize for Notar-E clients." },
  { key: "mobile_notary", label: "Mobile Notary", short: "Travel to clients across Michigan." },
  { key: "ron_notary", label: "Remote Online Notary", short: "Run secure online sessions." },
  { key: "signing_agent", label: "Notary Signing Agent", short: "Loan & real estate closings." },
  { key: "sales", label: "Sales / Business Development", short: "Grow business partnerships." },
  { key: "operations", label: "Operations", short: "Scheduling, quality & support." },
] as const;

export type CareerRoleKey = (typeof CAREER_ROLES)[number]["key"] | "other";
export const CAREER_ROLE_KEYS = [
  "commissioned_notary",
  "mobile_notary",
  "ron_notary",
  "signing_agent",
  "sales",
  "operations",
  "other",
] as const satisfies readonly CareerRoleKey[];
export const CAREER_ROLE_LABELS: Record<string, string> = Object.fromEntries([
  ...CAREER_ROLES.map((r) => [r.key, r.label]),
  ["other", "Other / Not sure"],
]);

export const EXPERIENCE_LEVELS = [
  { key: "none", label: "None" },
  { key: "lt1", label: "Under 1 year" },
  { key: "1to3", label: "1–3 years" },
  { key: "3plus", label: "3+ years" },
] as const;
export const EXPERIENCE_LABELS: Record<string, string> = Object.fromEntries(EXPERIENCE_LEVELS.map((e) => [e.key, e.label]));

export const APPLICATION_STATUSES = ["new", "reviewing", "interview", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  interview: "Interview",
  approved: "Approved",
  rejected: "Rejected",
};
export const APPLICATION_STATUS_TONES: Record<ApplicationStatus, "blue" | "amber" | "dark" | "green" | "red"> = {
  new: "blue",
  reviewing: "amber",
  interview: "dark",
  approved: "green",
  rejected: "red",
};

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS",
  "MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;

/** Resume limits: small enough for serverless request bodies (Vercel ~4.5 MB). */
export const RESUME_MAX_BYTES = 3 * 1024 * 1024;
export const RESUME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const experience = z.enum(["none", "lt1", "1to3", "3plus"]);
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .default("")
  .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v), "Enter a full link starting with https://");

export const careerApplicationSchema = z
  .object({
    firstName: z.string().trim().min(1, "Required").max(80),
    lastName: z.string().trim().min(1, "Required").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(320),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a valid phone number"),
    city: z.string().trim().min(2, "Required").max(80),
    state: z.enum(US_STATES, { message: "Choose a state" }),
    roleKey: z.enum(CAREER_ROLE_KEYS, { message: "Choose an area" }),
    jobOpeningId: z.string().max(40).optional().default(""),
    isCommissioned: z.enum(["yes", "no"], { message: "Choose one" }),
    commissionState: z.string().trim().max(2).optional().default(""),
    commissionExpiration: z.string().trim().max(10).optional().default(""),
    mobileExperience: experience,
    ronExperience: experience,
    signingAgentExperience: experience,
    availability: z.string().trim().max(300).optional().default(""),
    linkedinUrl: optionalUrl,
    message: z.string().trim().max(2000).optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.isCommissioned === "yes") {
      if (!v.commissionState) ctx.addIssue({ code: "custom", path: ["commissionState"], message: "Required" });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.commissionExpiration)) {
        ctx.addIssue({ code: "custom", path: ["commissionExpiration"], message: "Required" });
      }
    }
  });

export type CareerApplicationInput = z.infer<typeof careerApplicationSchema>;

/** Check the first bytes so a renamed file can't pass as a PDF/Word document. */
export function sniffResumeType(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "application/pdf"; // %PDF-
  if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; // ZIP container (docx)
  }
  if (b.length >= 8 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) return "application/msword"; // OLE2 (doc)
  return null;
}
