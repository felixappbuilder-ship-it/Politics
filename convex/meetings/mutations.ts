import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../lib/permissions";
import { meetingStatusValidator } from "../lib/validators";

function validateMeetingTimes(startTime: number, endTime?: number) {
  if (!Number.isFinite(startTime)) {
    throw new Error("Meeting start time must be a valid timestamp");
  }

  if (endTime !== undefined && (!Number.isFinite(endTime) || endTime <= startTime)) {
    throw new Error("Meeting end time must be later than its start time");
  }
}

export const createMeeting = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.optional(meetingStatusValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    const title = args.title.trim();

    if (!title) {
      throw new Error("Meeting title is required");
    }

    validateMeetingTimes(args.startTime, args.endTime);

    const now = Date.now();
    return await ctx.db.insert("meetings", {
      title,
      ...(args.description !== undefined ? { description: args.description.trim() } : {}),
      ...(args.location !== undefined ? { location: args.location.trim() } : {}),
      startTime: args.startTime,
      ...(args.endTime !== undefined ? { endTime: args.endTime } : {}),
      status: args.status ?? "scheduled",
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    status: v.optional(meetingStatusValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const nextStartTime = args.startTime ?? meeting.startTime;
    const nextEndTime = args.endTime ?? meeting.endTime;
    validateMeetingTimes(nextStartTime, nextEndTime);

    const patch: {
      title?: string;
      description?: string;
      location?: string;
      startTime?: number;
      endTime?: number;
      status?: "scheduled" | "completed" | "cancelled";
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (args.title !== undefined) {
      const title = args.title.trim();
      if (!title) throw new Error("Meeting title is required");
      patch.title = title;
    }
    if (args.description !== undefined) patch.description = args.description.trim();
    if (args.location !== undefined) patch.location = args.location.trim();
    if (args.startTime !== undefined) patch.startTime = args.startTime;
    if (args.endTime !== undefined) patch.endTime = args.endTime;
    if (args.status !== undefined) patch.status = args.status;

    await ctx.db.patch(args.meetingId, patch);
    return args.meetingId;
  },
});

export const deleteMeeting = mutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    await ctx.db.delete(args.meetingId);
    return args.meetingId;
  },
});
