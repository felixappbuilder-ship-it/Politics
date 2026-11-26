import { internalQuery, query } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/auth";
import { v } from "convex/values";

export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("conversations")
      .withIndex("by_user_id_updated_at", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation_id_created_at", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .take(200);
  },
});

export const getConversationForAction = internalQuery({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== args.userId) {
      return null;
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id_created_at", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(20);

    return {
      conversation,
      messages: messages.reverse().map((message) => ({
        role: message.role,
        content: message.content,
      })),
    };
  },
});
