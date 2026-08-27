import { z } from "zod";

export const bookingSchema = z.object({
  appointmentType: z.enum(["in_person", "remote"]),
  serviceType: z.string().min(1).max(200),
  documentType: z.string().min(1).max(200),
  numberOfActs: z.coerce.number().int().min(1).max(20),
  date: z.string().min(1).max(20),
  time: z.string().min(1).max(20),
  name: z.string().min(2, "Please enter your full name").max(200),
  email: z.string().email("Please enter a valid email address").max(320),
  phone: z.string().min(7, "Please enter a valid phone number").max(30),
  company: z.string().max(200).optional().default(""),
  address: z.string().max(500).optional().default(""),
  notes: z.string().max(2000).optional().default(""),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const contactSchema = z.object({
  name: z.string().min(2).max(200),
  company: z.string().max(200).optional().default(""),
  email: z.string().email().max(320),
  phone: z.string().max(30).optional().default(""),
  serviceNeeded: z.string().max(200).optional().default(""),
  message: z.string().min(5).max(4000),
  estimatedAppointmentsPerMonth: z.string().max(50).optional().default(""),
  isBusinessLead: z.coerce.boolean().optional().default(false),
});

export const businessInquirySchema = z.object({
  companyName: z.string().min(2, "Please enter your company name").max(200),
  category: z.string().min(1).max(100),
  contactName: z.string().min(2, "Please enter your name").max(200),
  email: z.string().email("Please enter a valid email address").max(320),
  phone: z.string().min(7, "Please enter a valid phone number").max(30),
  expectedMonthlyVolume: z.coerce.number().int().min(0).max(1000),
  message: z.string().max(4000).optional().default(""),
});

export type BusinessInquiryInput = z.infer<typeof businessInquirySchema>;
