import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../lib/permissions";
import { actionStatusValidator } from "../lib/validators";

function validateDeadline(deadline?: number) {
  if (deadline !== undefined && !Number.isFinite(deadline)) {
    throw new Error("Action deadline must be a valid timestamp");
  }
}

export const createAction = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    assignee: v.optional(v.string()),
    deadline: v.optional(v.number()),
    status: v.optional(actionStatusValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    const title = args.title.trim();

    if (!title) {
      throw new Error("Action title is required");
    }

    validateDeadline(args.deadline);

    const now = Date.now();
    return await ctx.db.insert("actions", {
      title,
      ...(args.description !== undefined
        ? { description: args.description.trim() }
        : {}),
      ...(args.assignee !== undefined
        ? { assignee: args.assignee.trim() }
        : {}),
      ...(args.deadline !== undefined ? { deadline: args.deadline } : {}),
      status: args.status ?? "pending",
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAction = mutation({
  args: {
    actionId: v.id("actions"),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    assignee: v.optional(v.union(v.string(), v.null())),
    deadline: v.optional(v.union(v.number(), v.null())),
    status: v.optional(actionStatusValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throw new Error("Action not found");
    }

    if (args.deadline !== undefined && args.deadline !== null) {
      validateDeadline(args.deadline);
    }

    const patch: {
      title?: string;
      description?: string;
      assignee?: string;
      deadline?: number;
      status?: "pending" | "in_progress" | "completed" | "cancelled";
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (args.title !== undefined) {
      const title = args.title.trim();
      if (!title) throw new Error("Action title is required");
      patch.title = title;
    }

    if (args.description !== undefined) {
      patch.description =
        args.description === null ? undefined : args.description.trim();
    }

    if (args.assignee !== undefined) {
      patch.assignee =
        args.assignee === null ? undefined : args.assignee.trim();
    }

    if (args.deadline !== undefined) {
      patch.deadline = args.deadline === null ? undefined : args.deadline;
    }

    if (args.status !== undefined) {
      patch.status = args.status;
    }

    await ctx.db.patch(args.actionId, patch);
    return args.actionId;
  },
});

export const deleteAction = mutation({
  args: { actionId: v.id("actions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throw new Error("Action not found");
    }

    await ctx.db.delete(args.actionId);
    return args.actionId;
  },
});
