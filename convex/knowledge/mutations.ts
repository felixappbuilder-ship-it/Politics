import { mutation } from "../_generated/server";
import { requireAdmin } from "../lib/permissions";
import { v } from "convex/values";

const CHUNK_SIZE = 2_800;
const CHUNK_OVERLAP = 300;
const MAX_DOCUMENT_CHARACTERS = 250_000;

function splitIntoChunks(text: string) {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);
      if (boundary > start + CHUNK_SIZE * 0.65) end = boundary;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= text.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

/**
 * Ingests extracted plain text or Markdown into the searchable library.
 * Binary PDF/DOCX extraction is deliberately handled as a separate ingestion
 * stage; this endpoint does not pretend to parse binary files.
 */
export const createTextDocument = mutation({
  args: {
    title: v.string(),
    text: v.string(),
    fileName: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const title = args.title.trim();
    const fileName = args.fileName.trim();
    const content = args.text.trim();

    if (!title || !fileName || !content) {
      throw new Error("Title, filename, and document text are required");
    }
    if (content.length > MAX_DOCUMENT_CHARACTERS) {
      throw new Error(
        `Document exceeds the ${MAX_DOCUMENT_CHARACTERS} character limit`,
      );
    }

    const extension = fileName.toLowerCase().split(".").pop();
    if (extension !== "txt" && extension !== "md" && extension !== "markdown") {
      throw new Error("This ingestion endpoint accepts .txt and .md files only");
    }

    const storageId = await ctx.storage.store(
      new Blob([content], { type: "text/plain; charset=utf-8" }),
    );

    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      title,
      description: args.description?.trim() || undefined,
      storageId,
      fileName,
      fileType: extension === "txt" ? "text/plain" : "text/markdown",
      fileSize: new TextEncoder().encode(content).byteLength,
      status: "ready",
      uploadedBy: admin._id,
      createdAt: now,
      updatedAt: now,
      processedAt: now,
    });

    const chunks = splitIntoChunks(content);
    for (let index = 0; index < chunks.length; index += 1) {
      await ctx.db.insert("documentChunks", {
        documentId,
        content: chunks[index],
        chunkIndex: index,
        createdAt: now,
      });
    }

    return { documentId, chunksCreated: chunks.length };
  },
});

export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const document = await ctx.db.get(args.documentId);
    if (!document) return false;

    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_document_id", (q) =>
        q.eq("documentId", args.documentId),
      )
      .collect();

    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    await ctx.storage.delete(document.storageId);
    await ctx.db.delete(args.documentId);
    return true;
  },
});
