import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/auth";
import { meetingStatusValidator } from "../lib/validators";

export const listMeetings = query({
  args: {
    status: v.optional(meetingStatusValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 100);
    const meetingsQuery = ctx.db.query("meetings").withIndex("by_start_time");

    if (args.status) {
      return await meetingsQuery
        .filter((q) => q.eq(q.field("status"), args.status))
        .order("asc")
        .take(limit);
    }

    return await meetingsQuery.order("asc").take(limit);
  },
});

export const getMeeting = query({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);
    return await ctx.db.get(args.meetingId);
  },
});
