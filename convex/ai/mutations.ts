import { internalMutation, mutation } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/auth";
import { v } from "convex/values";

export const createConversation = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const title = args.title?.trim().slice(0, 100) || "New conversation";
    const now = Date.now();

    return await ctx.db.insert("conversations", {
      userId: user._id,
      title,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const renameConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    const title = args.title.trim();
    if (!title) throw new Error("Title cannot be empty");

    await ctx.db.patch(args.conversationId, {
      title: title.slice(0, 100),
      updatedAt: Date.now(),
    });
  },
});

export const getOrCreateConversation = internalMutation({
  args: {
    userId: v.id("users"),
    conversationId: v.optional(v.id("conversations")),
    firstMessage: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.conversationId) {
      const existing = await ctx.db.get(args.conversationId);
      if (!existing || existing.userId !== args.userId) {
        throw new Error("Conversation not found");
      }
      return args.conversationId;
    }

    const now = Date.now();
    const title = args.firstMessage.trim().replace(/\\s+/g, " ").slice(0, 72);
    return await ctx.db.insert("conversations", {
      userId: args.userId,
      title: title || "New conversation",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const saveExchange = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    userMessage: v.string(),
    assistantMessage: v.string(),
    model: v.string(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    totalTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || conversation.userId !== args.userId) {
      throw new Error("Conversation not found");
    }

    const now = Date.now();

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: args.userId,
      role: "user",
      content: args.userMessage,
      createdAt: now,
    });

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: args.userId,
      role: "assistant",
      content: args.assistantMessage,
      model: args.model,
      tokenUsage:
        args.promptTokens !== undefined ||
        args.completionTokens !== undefined ||
        args.totalTokens !== undefined
          ? {
              promptTokens: args.promptTokens,
              completionTokens: args.completionTokens,
              totalTokens: args.totalTokens,
            }
          : undefined,
      createdAt: now + 1,
    });

    await ctx.db.patch(args.conversationId, { updatedAt: now + 1 });

    return { conversationId: args.conversationId };
  },
});
