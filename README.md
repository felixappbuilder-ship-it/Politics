# TIPO HUB Backend

Convex backend for TIPO HUB.

## Stack
- Convex database, queries, mutations, and actions
- External JWT issuer; Convex verifies JWTs
- DeepSeek for AI generation
- Convex full-text search for the initial RAG retrieval layer

## Security
Never commit API keys, JWT signing secrets, or other credentials. Configure secrets with `npx convex env set`.

## Status
Backend foundation is being implemented. See the Convex schema and feature modules for the current API surface.
