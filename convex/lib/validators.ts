import { v } from "convex/values";

export const userRoleValidator = v.union(
  v.literal("admin"),
  v.literal("staff"),
);

export const meetingStatusValidator = v.union(
  v.literal("scheduled"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const actionStatusValidator = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const documentStatusValidator = v.union(
  v.literal("uploaded"),
  v.literal("processing"),
  v.literal("ready"),
  v.literal("failed"),
);
