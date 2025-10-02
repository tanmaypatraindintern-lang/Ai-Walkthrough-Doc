import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed, Ok
  jsonTemplate: jsonb("json_template"),
  excelMetadata: jsonb("excel_metadata"),
  fieldMappings: jsonb("field_mappings"),
  transformedRules: jsonb("transformed_rules"),
  documentPath: text("document_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fieldMappings = pgTable("field_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id),
  jsonField: text("json_field").notNull(),
  excelColumn: text("excel_column").notNull(),
  confidence: real("confidence").notNull(),
  isAccepted: integer("is_accepted").default(0), // 0 = pending, 1 = accepted, -1 = rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const ruleTransformations = pgTable("rule_transformations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id),
  originalRule: text("original_rule").notNull(),
  transformedRule: text("transformed_rule").notNull(),
  confidence: real("confidence").notNull(),
  isAccepted: integer("is_accepted").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFieldMappingSchema = createInsertSchema(fieldMappings).omit({
  id: true,
  createdAt: true,
});

export const insertRuleTransformationSchema = createInsertSchema(ruleTransformations).omit({
  id: true,
  createdAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertFieldMapping = z.infer<typeof insertFieldMappingSchema>;
export type FieldMapping = typeof fieldMappings.$inferSelect;
export type InsertRuleTransformation = z.infer<typeof insertRuleTransformationSchema>;
export type RuleTransformation = typeof ruleTransformations.$inferSelect;

// Frontend types for file processing
export const fileUploadSchema = z.object({
  jsonFile: z.any().optional(),
  excelFile: z.any().optional(),
  name: z.string().min(1, "Document name is required"),
  useLLM: z.boolean().default(false),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
});

export type FileUpload = z.infer<typeof fileUploadSchema>;
