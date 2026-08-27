export const APPOINTMENT_STATUSES = ["scheduled", "completed", "cancelled", "no_show"] as const;
export const APPOINTMENT_TYPES = ["in_person", "remote"] as const;
export const PAYMENT_STATUSES = ["unpaid", "paid"] as const;
export const PAYMENT_METHODS = ["card", "cash", "check", "invoice", "ach"] as const;

export const LEAD_STATUSES = [
  "new_lead",
  "contacted",
  "interested",
  "proposal_sent",
  "active_client",
  "recurring_client",
  "inactive",
  "lost",
] as const;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  interested: "Interested",
  proposal_sent: "Proposal Sent",
  active_client: "Active Client",
  recurring_client: "Recurring Client",
  inactive: "Inactive",
  lost: "Lost",
};

export const CLIENT_TYPES = [
  "individual",
  "real_estate_agent",
  "title_company",
  "mortgage_company",
  "law_firm",
  "property_management",
  "dealership",
  "financial_institution",
  "healthcare",
  "small_business",
  "other",
] as const;

export const BUSINESS_CATEGORIES = [
  "title_company",
  "mortgage_company",
  "real_estate_brokerage",
  "real_estate_agent",
  "law_firm",
  "property_management",
  "dealership",
  "bank_credit_union",
  "healthcare",
  "senior_living",
  "small_business",
  "other",
] as const;

export const BUSINESS_CATEGORY_LABELS: Record<string, string> = {
  title_company: "Title Company",
  mortgage_company: "Mortgage Company",
  real_estate_brokerage: "Real Estate Brokerage",
  real_estate_agent: "Real Estate Agent",
  law_firm: "Law Firm",
  property_management: "Property Management Company",
  dealership: "Dealership",
  bank_credit_union: "Bank / Credit Union",
  healthcare: "Healthcare",
  senior_living: "Senior Living",
  small_business: "Small Business",
  other: "Other",
};

export const PIPELINE_STAGES = [
  "lead",
  "contacted",
  "meeting_scheduled",
  "proposal_sent",
  "negotiating",
  "won",
  "lost",
] as const;

export const PIPELINE_STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  contacted: "Contacted",
  meeting_scheduled: "Meeting Scheduled",
  proposal_sent: "Proposal Sent",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
};

export const OUTREACH_METHODS = ["call", "email", "text", "in_person"] as const;
export const OUTREACH_METHOD_LABELS: Record<string, string> = {
  call: "Call",
  email: "Email",
  text: "Text",
  in_person: "In Person",
};

export const OUTREACH_RESPONSES = ["no_response", "interested", "not_interested", "callback", "voicemail"] as const;
export const OUTREACH_RESPONSE_LABELS: Record<string, string> = {
  no_response: "No Response",
  interested: "Interested",
  not_interested: "Not Interested",
  callback: "Requested Callback",
  voicemail: "Left Voicemail",
};

export const OUTREACH_STATUSES = ["new", "follow_up", "meeting_booked", "won", "lost"] as const;

export const EXPENSE_CATEGORIES = [
  "gas",
  "mileage",
  "printing",
  "paper",
  "ink",
  "marketing",
  "advertising",
  "website",
  "software",
  "notary_supplies",
  "insurance",
  "phone",
  "office_supplies",
  "professional_services",
  "other",
] as const;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  gas: "Gas",
  mileage: "Mileage",
  printing: "Printing",
  paper: "Paper",
  ink: "Ink",
  marketing: "Marketing",
  advertising: "Advertising",
  website: "Website",
  software: "Software",
  notary_supplies: "Notary Supplies",
  insurance: "Insurance",
  phone: "Phone",
  office_supplies: "Office Supplies",
  professional_services: "Professional Services",
  other: "Other",
};

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const SERVICE_TYPES = [
  "General Notary",
  "Real Estate Documents",
  "Affidavits",
  "Acknowledgments",
  "Jurats",
  "Power of Attorney",
  "Business Documents",
  "Vehicle Documents",
  "Financial Documents",
  "Estate Documents",
  "Other",
] as const;

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
