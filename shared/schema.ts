import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  date,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table - matching existing database structure
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  password: varchar("password"),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // employee, manager, hr_admin
  department: varchar("department"),
  employeeId: varchar("employee_id").unique(),
  managerId: varchar("manager_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  departmentIdx: index("users_department_idx").on(table.department),
  managerIdx: index("users_manager_id_idx").on(table.managerId),
}));

// Training catalog
export const trainingCatalog = pgTable("training_catalog", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // internal, external, certification, compliance
  category: varchar("category").notNull(), // safety, quality, compliance, technical
  duration: integer("duration_hours").notNull(), // duration in hours
  validityPeriod: integer("validity_period_months"), // how long certification is valid
  isRequired: boolean("is_required").default(false),
  complianceStandard: varchar("compliance_standard"), // ISO45001, OSHA, etc.
  prerequisites: text("prerequisites"),
  // External training specific fields
  cost: integer("cost"), // cost in cents for precise calculation
  currency: varchar("currency").default("USD"),
  providerName: varchar("provider_name"), // training provider/institute name
  providerContact: varchar("provider_contact"), // contact info
  location: varchar("location"), // training location
  externalUrl: varchar("external_url"), // provider website/course link
  // Trainer information
  trainerName: varchar("trainer_name"), // trainer name for the training
  trainerType: varchar("trainer_type"), // internal, external, contractor
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training sessions
export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").references(() => trainingCatalog.id),
  title: varchar("title").notNull(),
  sessionDate: timestamp("session_date").notNull(),
  duration: integer("duration_hours").notNull(),
  venue: varchar("venue"),
  trainerName: varchar("trainer_name"),
  trainerType: varchar("trainer_type").notNull(), // internal, external
  maxParticipants: integer("max_participants"),
  status: varchar("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  materials: text("materials"), // JSON array of material URLs
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training enrollments/attendance
export const trainingEnrollments = pgTable("training_enrollments", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => trainingSessions.id),
  employeeId: varchar("employee_id").references(() => users.id),
  status: varchar("status").notNull().default("enrolled"), // enrolled, attended, completed, absent
  completionDate: timestamp("completion_date"),
  score: integer("score"), // if applicable
  certificateUrl: varchar("certificate_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training feedback
export const trainingFeedback = pgTable("training_feedback", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => trainingEnrollments.id),
  sessionId: integer("session_id").references(() => trainingSessions.id),
  employeeId: varchar("employee_id").references(() => users.id),
  overallRating: integer("overall_rating").notNull(), // 1-5
  contentRating: integer("content_rating").notNull(), // 1-5
  trainerRating: integer("trainer_rating").notNull(), // 1-5
  relevanceRating: integer("relevance_rating").notNull(), // 1-5
  comments: text("comments"),
  suggestions: text("suggestions"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Manager effectiveness evaluations
export const effectivenessEvaluations = pgTable("effectiveness_evaluations", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => trainingEnrollments.id),
  employeeId: varchar("employee_id").references(() => users.id),
  managerId: varchar("manager_id").references(() => users.id),
  evaluationDate: timestamp("evaluation_date").notNull(),
  knowledgeApplication: integer("knowledge_application"), // 1-5
  behaviorChange: integer("behavior_change"), // 1-5
  performanceImprovement: integer("performance_improvement"), // 1-5
  complianceAdherence: integer("compliance_adherence"), // 1-5
  overallEffectiveness: integer("overall_effectiveness").notNull(), // 1-5
  comments: text("comments"),
  actionPlan: text("action_plan"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Evidence attachments
export const evidenceAttachments = pgTable("evidence_attachments", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => trainingEnrollments.id),
  sessionId: integer("session_id").references(() => trainingSessions.id),
  fileName: varchar("file_name").notNull(),
  originalFileName: varchar("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: varchar("file_type").notNull(),
  filePath: varchar("file_path").notNull(),
  description: text("description"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Audit logs (immutable records)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type").notNull(), // training_session, enrollment, etc.
  entityId: integer("entity_id").notNull(),
  action: varchar("action").notNull(), // create, update, delete
  changes: jsonb("changes"), // JSON of what changed
  performedBy: varchar("performed_by").references(() => users.id),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
});

// Compliance requirements
export const complianceRequirements = pgTable("compliance_requirements", {
  id: serial("id").primaryKey(),
  standard: varchar("standard").notNull(), // ISO45001, OSHA, etc.
  requirement: text("requirement").notNull(),
  description: text("description"),
  frequency: varchar("frequency"), // annual, monthly, etc.
  department: varchar("department"),
  role: varchar("role"),
  trainingCatalogId: integer("training_catalog_id").references(() => trainingCatalog.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Skills master
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(), // BEHAVIORAL, PROCEDURAL, TECHNICAL, LANGUAGE, SAFETY, DOMAIN, OTHER
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendors
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  contactName: varchar("contact_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  gstNumber: varchar("gst_number"),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trainers
export const trainers = pgTable("trainers", {
  id: serial("id").primaryKey(),
  type: varchar("type").notNull(), // INTERNAL, EXTERNAL
  employeeId: varchar("employee_id").references(() => users.id), // for internal trainers
  vendorId: integer("vendor_id").references(() => vendors.id), // for external trainers
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  specialization: text("specialization"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training needs
export const trainingNeeds = pgTable("training_needs", {
  id: serial("id").primaryKey(),
  requestedByUserId: varchar("requested_by_user_id").references(() => users.id),
  forEmployeeId: varchar("for_employee_id").references(() => users.id),
  skillId: integer("skill_id").references(() => skills.id),
  title: varchar("title"),
  details: text("details"),
  preferredQuarter: varchar("preferred_quarter"), // Q1, Q2, Q3, Q4
  preferredMonth: varchar("preferred_month"),
  type: varchar("type").notNull(), // INTERNAL, EXTERNAL, ANY
  submissionSource: varchar("submission_source").notNull().default("EMPLOYEE"), // EMPLOYEE, MANAGER - determines approval flow
  status: varchar("status").notNull().default("SUBMITTED"), // SUBMITTED, MGR_APPROVED, HR_APPROVED, REJECTED
  statusReason: text("status_reason"),
  managerApprovedBy: varchar("manager_approved_by").references(() => users.id),
  managerApprovedAt: timestamp("manager_approved_at"),
  hrApprovedBy: varchar("hr_approved_by").references(() => users.id),
  hrApprovedAt: timestamp("hr_approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  decidedAt: timestamp("decided_at"),
  decidedBy: varchar("decided_by").references(() => users.id),
});

// Training plans
export const trainingPlans = pgTable("training_plans", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training plan items
export const trainingPlanItems = pgTable("training_plan_items", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => trainingPlans.id),
  skillId: integer("skill_id").references(() => skills.id),
  title: varchar("title").notNull(),
  targetAudienceQuery: jsonb("target_audience_query"), // JSON query for filtering employees
  tentativeMonth: varchar("tentative_month"),
  expectedHours: integer("expected_hours"),
  type: varchar("type").notNull(), // INTERNAL, EXTERNAL
  status: varchar("status").notNull().default("PLANNED"), // PLANNED, CONVERTED, CANCELLED
  convertedToSessionId: integer("converted_to_session_id").references(() => trainingSessions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Nominations (separate from enrollments for approval workflow)
export const nominations = pgTable("nominations", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => trainingSessions.id),
  employeeId: varchar("employee_id").references(() => users.id),
  source: varchar("source").notNull(), // SELF, MANAGER, HR
  status: varchar("status").notNull().default("PENDING"), // PENDING, APPROVED, REJECTED, WAITLIST
  decidedBy: varchar("decided_by").references(() => users.id),
  decidedAt: timestamp("decided_at"),
  reason: text("reason"), // rejection or waitlist reason
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  enrollments: many(trainingEnrollments),
  feedback: many(trainingFeedback),
  evaluationsAsEmployee: many(effectivenessEvaluations, { relationName: "employee" }),
  evaluationsAsManager: many(effectivenessEvaluations, { relationName: "manager" }),
  manager: one(users, { fields: [users.managerId], references: [users.id] }),
  directReports: many(users, { relationName: "manager" }),
}));

export const trainingCatalogRelations = relations(trainingCatalog, ({ one, many }) => ({
  sessions: many(trainingSessions),
  creator: one(users, { fields: [trainingCatalog.createdBy], references: [users.id] }),
  complianceRequirement: many(complianceRequirements),
}));

export const trainingSessionsRelations = relations(trainingSessions, ({ one, many }) => ({
  catalog: one(trainingCatalog, { fields: [trainingSessions.catalogId], references: [trainingCatalog.id] }),
  enrollments: many(trainingEnrollments),
  feedback: many(trainingFeedback),
  attachments: many(evidenceAttachments),
  creator: one(users, { fields: [trainingSessions.createdBy], references: [users.id] }),
}));

export const trainingEnrollmentsRelations = relations(trainingEnrollments, ({ one, many }) => ({
  session: one(trainingSessions, { fields: [trainingEnrollments.sessionId], references: [trainingSessions.id] }),
  employee: one(users, { fields: [trainingEnrollments.employeeId], references: [users.id] }),
  feedback: many(trainingFeedback),
  evaluations: many(effectivenessEvaluations),
  attachments: many(evidenceAttachments),
}));

export const trainingFeedbackRelations = relations(trainingFeedback, ({ one }) => ({
  enrollment: one(trainingEnrollments, { fields: [trainingFeedback.enrollmentId], references: [trainingEnrollments.id] }),
  session: one(trainingSessions, { fields: [trainingFeedback.sessionId], references: [trainingSessions.id] }),
  employee: one(users, { fields: [trainingFeedback.employeeId], references: [users.id] }),
}));

export const effectivenessEvaluationsRelations = relations(effectivenessEvaluations, ({ one }) => ({
  enrollment: one(trainingEnrollments, { fields: [effectivenessEvaluations.enrollmentId], references: [trainingEnrollments.id] }),
  employee: one(users, { fields: [effectivenessEvaluations.employeeId], references: [users.id] }),
  manager: one(users, { fields: [effectivenessEvaluations.managerId], references: [users.id] }),
}));

export const evidenceAttachmentsRelations = relations(evidenceAttachments, ({ one }) => ({
  enrollment: one(trainingEnrollments, { fields: [evidenceAttachments.enrollmentId], references: [trainingEnrollments.id] }),
  session: one(trainingSessions, { fields: [evidenceAttachments.sessionId], references: [trainingSessions.id] }),
  uploader: one(users, { fields: [evidenceAttachments.uploadedBy], references: [users.id] }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  trainingNeeds: many(trainingNeeds),
  planItems: many(trainingPlanItems),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  trainers: many(trainers),
}));

export const trainersRelations = relations(trainers, ({ one }) => ({
  employee: one(users, { fields: [trainers.employeeId], references: [users.id] }),
  vendor: one(vendors, { fields: [trainers.vendorId], references: [vendors.id] }),
}));

export const trainingNeedsRelations = relations(trainingNeeds, ({ one }) => ({
  requestedBy: one(users, { fields: [trainingNeeds.requestedByUserId], references: [users.id], relationName: "requestedBy" }),
  forEmployee: one(users, { fields: [trainingNeeds.forEmployeeId], references: [users.id], relationName: "forEmployee" }),
  skill: one(skills, { fields: [trainingNeeds.skillId], references: [skills.id] }),
  decidedByUser: one(users, { fields: [trainingNeeds.decidedBy], references: [users.id], relationName: "decidedBy" }),
  managerApprover: one(users, { fields: [trainingNeeds.managerApprovedBy], references: [users.id], relationName: "managerApprover" }),
  hrApprover: one(users, { fields: [trainingNeeds.hrApprovedBy], references: [users.id], relationName: "hrApprover" }),
}));

export const trainingPlansRelations = relations(trainingPlans, ({ one, many }) => ({
  creator: one(users, { fields: [trainingPlans.createdBy], references: [users.id] }),
  items: many(trainingPlanItems),
}));

export const trainingPlanItemsRelations = relations(trainingPlanItems, ({ one }) => ({
  plan: one(trainingPlans, { fields: [trainingPlanItems.planId], references: [trainingPlans.id] }),
  skill: one(skills, { fields: [trainingPlanItems.skillId], references: [skills.id] }),
  convertedSession: one(trainingSessions, { fields: [trainingPlanItems.convertedToSessionId], references: [trainingSessions.id] }),
}));

export const nominationsRelations = relations(nominations, ({ one }) => ({
  session: one(trainingSessions, { fields: [nominations.sessionId], references: [trainingSessions.id] }),
  employee: one(users, { fields: [nominations.employeeId], references: [users.id] }),
  decidedByUser: one(users, { fields: [nominations.decidedBy], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingCatalogSchema = createInsertSchema(trainingCatalog).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingSessionSchema = createInsertSchema(trainingSessions)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    sessionDate: z.string().or(z.date()).transform((val) => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    })
  });
export const insertTrainingEnrollmentSchema = createInsertSchema(trainingEnrollments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingFeedbackSchema = createInsertSchema(trainingFeedback).omit({ id: true });
export const insertEffectivenessEvaluationSchema = createInsertSchema(effectivenessEvaluations).omit({ id: true, createdAt: true });
export const insertEvidenceAttachmentSchema = createInsertSchema(evidenceAttachments).omit({ id: true, uploadedAt: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true, createdAt: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainerSchema = createInsertSchema(trainers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingNeedSchema = createInsertSchema(trainingNeeds).omit({ id: true, createdAt: true, decidedAt: true });
export const insertTrainingPlanSchema = createInsertSchema(trainingPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingPlanItemSchema = createInsertSchema(trainingPlanItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNominationSchema = createInsertSchema(nominations).omit({ id: true, createdAt: true, updatedAt: true, decidedAt: true });

// Types
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type TrainingCatalog = typeof trainingCatalog.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type TrainingEnrollment = typeof trainingEnrollments.$inferSelect;
export type TrainingFeedback = typeof trainingFeedback.$inferSelect;
export type EffectivenessEvaluation = typeof effectivenessEvaluations.$inferSelect;
export type EvidenceAttachment = typeof evidenceAttachments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ComplianceRequirement = typeof complianceRequirements.$inferSelect;

export type InsertTrainingCatalog = z.infer<typeof insertTrainingCatalogSchema>;
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type InsertTrainingEnrollment = z.infer<typeof insertTrainingEnrollmentSchema>;
export type InsertTrainingFeedback = z.infer<typeof insertTrainingFeedbackSchema>;
export type InsertEffectivenessEvaluation = z.infer<typeof insertEffectivenessEvaluationSchema>;
export type InsertEvidenceAttachment = z.infer<typeof insertEvidenceAttachmentSchema>;

// New table types
export type Skill = typeof skills.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Trainer = typeof trainers.$inferSelect;
export type TrainingNeed = typeof trainingNeeds.$inferSelect;
export type TrainingPlan = typeof trainingPlans.$inferSelect;
export type TrainingPlanItem = typeof trainingPlanItems.$inferSelect;
export type Nomination = typeof nominations.$inferSelect;

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type InsertTrainer = z.infer<typeof insertTrainerSchema>;
export type InsertTrainingNeed = z.infer<typeof insertTrainingNeedSchema>;
export type InsertTrainingPlan = z.infer<typeof insertTrainingPlanSchema>;
export type InsertTrainingPlanItem = z.infer<typeof insertTrainingPlanItemSchema>;
export type InsertNomination = z.infer<typeof insertNominationSchema>;
