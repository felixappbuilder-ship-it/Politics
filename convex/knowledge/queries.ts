import { internalQuery, query } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/auth";
import { v } from "convex/values";

export const listDocuments = query({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);
    const documents = await ctx.db.query("documents").order("desc").take(200);

    return documents.map((document) => ({
      _id: document._id,
      title: document.title,
      description: document.description,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      status: document.status,
      createdAt: document.createdAt,
      processedAt: document.processedAt,
      failureReason: document.failureReason,
    }));
  },
});

export const getDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);
    const document = await ctx.db.get(args.documentId);
    if (!document) return null;

    return {
      _id: document._id,
      title: document.title,
      description: document.description,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      status: document.status,
      createdAt: document.createdAt,
      processedAt: document.processedAt,
      failureReason: document.failureReason,
    };
  },
});

export const searchKnowledge = internalQuery({
  args: {
    searchText: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchText = args.searchText.trim();
    if (!searchText) return [];

    const limit = Math.min(Math.max(Math.floor(args.limit ?? 5), 1), 8);
    const matches = await ctx.db
      .query("documentChunks")
      .withSearchIndex("search_content", (q) =>
        q.search("content", searchText),
      )
      .take(limit * 3);

    const results = [];
    for (const chunk of matches) {
      const document = await ctx.db.get(chunk.documentId);
      if (!document || document.status !== "ready") continue;

      results.push({
        documentId: document._id,
        title: document.title,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
      });

      if (results.length >= limit) break;
    }

    return results;
  },
});
