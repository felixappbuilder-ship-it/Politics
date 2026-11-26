import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("staff")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_updated_at", ["userId", "updatedAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    model: v.optional(v.string()),
    tokenUsage: v.optional(
      v.object({
        promptTokens: v.optional(v.number()),
        completionTokens: v.optional(v.number()),
        totalTokens: v.optional(v.number()),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_conversation_id", ["conversationId"])
    .index("by_conversation_id_created_at", ["conversationId", "createdAt"])
    .index("by_user_id", ["userId"]),

  documents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    processedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_uploaded_by", ["uploadedBy"]),

  documentChunks: defineTable({
    documentId: v.id("documents"),
    content: v.string(),
    chunkIndex: v.number(),
    createdAt: v.number(),
  })
    .index("by_document_id", ["documentId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["documentId"],
    }),

  meetings: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_start_time", ["startTime"])
    .index("by_status", ["status"]),

  actions: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    assignee: v.optional(v.string()),
    deadline: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_deadline", ["deadline"]),

  announcements: defineTable({
    title: v.string(),
    content: v.string(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  }).index("by_active_created_at", ["isActive", "createdAt"]),

  deadlines: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    dueAt: v.number(),
    status: v.union(
      v.literal("upcoming"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_due_at", ["dueAt"])
    .index("by_status_due_at", ["status", "dueAt"]),

  wards: defineTable({
    name: v.string(),
    registeredVoters: v.number(),
    pollingStations: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  registrationCentres: defineTable({
    wardId: v.id("wards"),
    name: v.string(),
    registeredVoters: v.number(),
    pollingStations: v.number(),
    updatedAt: v.number(),
  }).index("by_ward_id", ["wardId"]),
});
