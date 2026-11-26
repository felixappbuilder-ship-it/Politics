import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/auth";

/**
 * Update the authenticated user's own profile.
 *
 * Authentication credentials and account roles are managed outside this
 * mutation. Users cannot create profiles, change their role, or change
 * their account activation state here.
 *
 * Pass email: null to clear the optional email field. Omit email to leave
 * the existing value unchanged.
 */
export const updateMyProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (args.name === undefined && args.email === undefined) {
      throw new Error("Provide at least one profile field to update");
    }

    const updates: {
      name?: string;
      email?: string | undefined;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      const name = args.name.trim();

      if (!name) {
        throw new Error("Name cannot be empty");
      }

      if (name.length > 100) {
        throw new Error("Name cannot exceed 100 characters");
      }

      updates.name = name;
    }

    if (args.email !== undefined) {
      if (args.email === null) {
        updates.email = undefined;
      } else {
        const email = args.email.trim();

        if (email.length > 254) {
          throw new Error("Email cannot exceed 254 characters");
        }

        if (
          email.length > 0 &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
          throw new Error("Enter a valid email address");
        }

        updates.email = email || undefined;
      }
    }

    await ctx.db.patch(user._id, updates);

    const updatedUser = await ctx.db.get(user._id);
    if (!updatedUser) {
      throw new Error("Profile could not be loaded after updating");
    }

    return {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    };
  },
});
