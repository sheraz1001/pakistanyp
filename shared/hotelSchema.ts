import { z } from 'zod';
import { pgTable, varchar, text, timestamp, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Hotel Bookings table
export const hotelBookings = pgTable("hotel_bookings", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  hotelId: varchar("hotel_id").notNull(),
  hotelName: varchar("hotel_name").notNull(),
  roomId: varchar("room_id").notNull(),
  roomName: varchar("room_name").notNull(),
  rateId: varchar("rate_id").notNull(),
  
  // Booking details
  checkIn: varchar("check_in").notNull(), // YYYY-MM-DD
  checkOut: varchar("check_out").notNull(), // YYYY-MM-DD
  nights: integer("nights").notNull(),
  adults: integer("adults").notNull(),
  children: integer("children").default(0),
  
  // Pricing
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  priceBreakdown: jsonb("price_breakdown"), // { basePrice, taxes, fees }
  
  // Contact information
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  
  // Booking status
  status: varchar("status").notNull(), // confirmed, pending, cancelled
  confirmationNumber: varchar("confirmation_number"),
  rateHawkBookingId: varchar("ratehawk_booking_id"),
  
  // Hotel details
  hotelAddress: text("hotel_address"),
  hotelCity: varchar("hotel_city"),
  hotelCountry: varchar("hotel_country").default("Pakistan"),
  hotelRating: decimal("hotel_rating", { precision: 2, scale: 1 }),
  hotelStarRating: integer("hotel_star_rating"),
  
  // Policies and details
  cancellationPolicy: text("cancellation_policy"),
  boardType: varchar("board_type"), // BB, HB, FB, AI
  paymentType: varchar("payment_type"), // now, hotel
  
  // Additional information
  specialRequests: text("special_requests"),
  bookingNotes: text("booking_notes"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hotel Search History table
export const hotelSearchHistory = pgTable("hotel_search_history", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  
  // Search parameters
  destination: varchar("destination").notNull(),
  checkIn: varchar("check_in").notNull(),
  checkOut: varchar("check_out").notNull(),
  adults: integer("adults").notNull(),
  children: integer("children").default(0),
  rooms: integer("rooms").default(1),
  currency: varchar("currency").default("USD"),
  
  // Search results
  resultsCount: integer("results_count").default(0),
  searchSource: varchar("search_source").default("ratehawk"), // ratehawk, fallback
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Hotel Favorites table
export const hotelFavorites = pgTable("hotel_favorites", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  hotelId: varchar("hotel_id").notNull(),
  hotelName: varchar("hotel_name").notNull(),
  hotelCity: varchar("hotel_city"),
  hotelCountry: varchar("hotel_country").default("Pakistan"),
  hotelRating: decimal("hotel_rating", { precision: 2, scale: 1 }),
  hotelImage: text("hotel_image"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const hotelSearchSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in date must be in YYYY-MM-DD format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out date must be in YYYY-MM-DD format"),
  adults: z.number().min(1, "At least 1 adult is required").max(10, "Maximum 10 adults allowed"),
  children: z.number().min(0).max(10).optional(),
  rooms: z.number().min(1).max(5).optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
});

export const hotelBookingSchema = z.object({
  hotelId: z.string().min(1, "Hotel ID is required"),
  roomId: z.string().min(1, "Room ID is required"),
  rateId: z.string().min(1, "Rate ID is required"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in date must be in YYYY-MM-DD format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out date must be in YYYY-MM-DD format"),
  adults: z.number().min(1).max(10),
  children: z.number().min(0).max(10).optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  paymentMethod: z.enum(["card", "bank_transfer"]),
  specialRequests: z.string().optional(),
});

// Insert schemas
export const insertHotelBookingSchema = createInsertSchema(hotelBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHotelSearchSchema = createInsertSchema(hotelSearchHistory).omit({
  id: true,
  createdAt: true,
});

export const insertHotelFavoriteSchema = createInsertSchema(hotelFavorites).omit({
  id: true,
  createdAt: true,
});

// Types
export type HotelBooking = typeof hotelBookings.$inferSelect;
export type InsertHotelBooking = z.infer<typeof insertHotelBookingSchema>;

export type HotelSearchHistory = typeof hotelSearchHistory.$inferSelect;
export type InsertHotelSearch = z.infer<typeof insertHotelSearchSchema>;

export type HotelFavorite = typeof hotelFavorites.$inferSelect;
export type InsertHotelFavorite = z.infer<typeof insertHotelFavoriteSchema>;

export type HotelSearchParams = z.infer<typeof hotelSearchSchema>;
export type HotelBookingRequest = z.infer<typeof hotelBookingSchema>;

// Import users table for foreign key reference (assuming it exists)
import { users } from './schema';