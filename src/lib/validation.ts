import { z } from "zod";

export const bookingSchema = z.object({
  appointmentType: z.enum(["in_person", "remote"]),
  serviceType: z.string().min(1),
  documentType: z.string().min(1),
  numberOfActs: z.coerce.number().int().min(1).max(20),
  date: z.string().min(1),
  time: z.string().min(1),
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  company: z.string().optional().default(""),
  address: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const contactSchema = z.object({
  name: z.string().min(2),
  company: z.string().optional().default(""),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  serviceNeeded: z.string().optional().default(""),
  message: z.string().min(5),
  estimatedAppointmentsPerMonth: z.string().optional().default(""),
  isBusinessLead: z.coerce.boolean().optional().default(false),
});

export const businessInquirySchema = z.object({
  companyName: z.string().min(2, "Please enter your company name"),
  category: z.string().min(1),
  contactName: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  expectedMonthlyVolume: z.coerce.number().int().min(0).max(1000),
  message: z.string().optional().default(""),
});

export type BusinessInquiryInput = z.infer<typeof businessInquirySchema>;
