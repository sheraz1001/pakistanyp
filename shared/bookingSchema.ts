import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Hotel bookings table
export const hotelBookings = pgTable("hotel_bookings", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id"),
  hotelId: varchar("hotel_id").notNull(),
  hotelName: varchar("hotel_name").notNull(),
  
  // Booking details
  checkIn: varchar("check_in").notNull(),
  checkOut: varchar("check_out").notNull(),
  adults: integer("adults").notNull().default(2),
  children: integer("children").notNull().default(0),
  rooms: integer("rooms").notNull().default(1),
  
  // Pricing
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("USD"),
  priceBreakdown: jsonb("price_breakdown").$type<{
    basePrice: number;
    taxes: number;
    fees: number;
    discount?: number;
  }>(),
  
  // Guest information
  guestInfo: jsonb("guest_info").$type<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      country: string;
      zipCode: string;
    };
  }>().notNull(),
  
  // Payment
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paymentStatus: varchar("payment_status").notNull().default("pending"), // pending, paid, failed, refunded
  
  // Booking status
  bookingStatus: varchar("booking_status").notNull().default("pending"), // pending, confirmed, cancelled, completed
  confirmationNumber: varchar("confirmation_number"),
  
  // Hotel details
  hotelLocation: jsonb("hotel_location").$type<{
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  }>(),
  
  hotelDetails: jsonb("hotel_details").$type<{
    stars: number;
    rating: number;
    amenities: string[];
    images: string[];
    description?: string;
  }>(),
  
  // Booking source
  bookingSource: varchar("booking_source").notNull().default("travelpayouts"), // travelpayouts, ratehawk
  externalBookingId: varchar("external_booking_id"),
  bookingUrl: varchar("booking_url"),
  
  // Special requests
  specialRequests: text("special_requests"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Booking schema for validation
export const createBookingSchema = createInsertSchema(hotelBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  confirmationNumber: true,
  stripePaymentIntentId: true,
});

export const updateBookingSchema = createBookingSchema.partial().extend({
  id: z.string(),
});

// Guest information schema
export const guestInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
  }).optional(),
});

// Payment intent schema
export const createPaymentIntentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
});

// Booking search schema
export const bookingSearchSchema = z.object({
  userId: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.number().default(10),
  offset: z.number().default(0),
});

export type HotelBooking = typeof hotelBookings.$inferSelect;
export type CreateBooking = z.infer<typeof createBookingSchema>;
export type UpdateBooking = z.infer<typeof updateBookingSchema>;
export type GuestInfo = z.infer<typeof guestInfoSchema>;
export type CreatePaymentIntent = z.infer<typeof createPaymentIntentSchema>;
export type BookingSearch = z.infer<typeof bookingSearchSchema>;