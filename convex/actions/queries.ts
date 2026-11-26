import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/auth";
import { actionStatusValidator } from "../lib/validators";

export const listActions = query({
  args: {
    status: v.optional(actionStatusValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 100);
    const actionsQuery = ctx.db.query("actions").withIndex("by_deadline");

    if (args.status) {
      return await actionsQuery
        .filter((q) => q.eq(q.field("status"), args.status))
        .order("asc")
        .take(limit);
    }

    return await actionsQuery.order("asc").take(limit);
  },
});

export const getAction = query({
  args: { actionId: v.id("actions") },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);
    return await ctx.db.get(args.actionId);
  },
});
