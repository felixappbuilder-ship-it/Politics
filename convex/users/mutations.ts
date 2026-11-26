import { internalMutation, mutation } from "../_generated/server";
import { requireAdmin } from "../lib/permissions";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("staff"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const tokenIdentifier = args.tokenIdentifier.trim();
    const name = args.name.trim();

    if (!tokenIdentifier || !name) {
      throw new Error("Token identifier and name are required");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .unique();

    if (existing) {
      throw new Error("A profile already exists for this identity");
    }

    const now = Date.now();

    return await ctx.db.insert("users", {
      tokenIdentifier,
      name,
      email: args.email?.trim() || undefined,
      role: args.role ?? "staff",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("staff"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updates: {
      name?: string;
      email?: string;
      role?: "admin" | "staff";
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) throw new Error("Name cannot be empty");
      updates.name = name;
    }

    if (args.email !== undefined) {
      updates.email = args.email.trim();
    }

    if (args.role !== undefined) {
      updates.role = args.role;
    }

    await ctx.db.patch(args.userId, updates);
    return args.userId;
  },
});

export const setUserActive = mutation({
  args: {
    userId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (admin._id === args.userId && !args.isActive) {
      throw new Error("An administrator cannot deactivate their own account");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return args.userId;
  },
});

/**
 * One-time bootstrap. Invoke only from the Convex dashboard/internal tooling
 * after the first administrator has already been created in the JWT issuer.
 * This function is not callable by application clients.
 */
export const bootstrapFirstAdmin = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUsers = await ctx.db.query("users").take(1);

    if (existingUsers.length > 0) {
      throw new Error("Bootstrap is closed: a user profile already exists");
    }

    const tokenIdentifier = args.tokenIdentifier.trim();
    const name = args.name.trim();

    if (!tokenIdentifier || !name) {
      throw new Error("Token identifier and name are required");
    }

    const now = Date.now();

    return await ctx.db.insert("users", {
      tokenIdentifier,
      name,
      email: args.email?.trim() || undefined,
      role: "admin",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
