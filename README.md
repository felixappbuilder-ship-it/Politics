# TIPO HUB Backend

Convex backend for TIPO HUB.

## Stack

- Convex database, queries, mutations, and actions
- External JWT issuer; Convex verifies signed access tokens
- DeepSeek Chat Completions API for server-side AI generation
- Convex full-text search for the initial retrieval-augmented generation (RAG) layer

## Repository structure

Feature code is grouped under `convex/`. The schema and authentication helpers are shared; domain functions remain in their feature folders.

## Local setup

1. Install Node.js (current LTS) and npm.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start Convex and link this project to a Convex deployment:

   ```bash
   npx convex dev
   ```

4. Configure the JWT issuer values for the deployment:

   ```bash
   npx convex env set TIPO_JWT_ISSUER_URL https://YOUR-OIDC-ISSUER
   npx convex env set TIPO_JWT_AUDIENCE YOUR-JWT-AUDIENCE
   ```

   The issuer must expose standard OIDC discovery/JWKS endpoints. The configured audience must exactly match the JWT `aud` claim. If the chosen issuer only exposes a custom JWKS endpoint or does not support OIDC discovery, update `convex/auth.config.ts` to use Convex's `customJwt` provider with its exact issuer, JWKS URL, and signing algorithm.

5. Configure the DeepSeek key on the Convex deployment:

   ```bash
   npx convex env set DEEPSEEK_API_KEY YOUR_SECRET
   ```

6. Run type checking:

   ```bash
   npm run typecheck
   ```

## First administrator

The external issuer creates and authenticates the administrator identity. Then invoke the internal function `users/mutations:bootstrapFirstAdmin` once from trusted Convex dashboard/internal tooling, passing the exact `tokenIdentifier` from that identity and the administrator's name. It refuses to run if any user profile already exists.

After bootstrap, create additional staff profiles through the admin-only `users/mutations:createUser` mutation. Do not add public self-registration or client-side role assignment.

## AI functions

- `ai/actions:sendMessage`: sends an authenticated message, retrieves up to five relevant ready document chunks, calls DeepSeek, and saves the user/assistant exchange.
- `ai/actions:generateAgenda`: generates a structured meeting agenda.
- `ai/actions:generateProposal`: drafts a neutral operational proposal.
- `ai/queries:listConversations` and `ai/queries:getMessages`: return only conversations owned by the authenticated user.
- `ai/mutations:createConversation` and `ai/mutations:renameConversation`: manage the caller's own conversations.

The AI action sends a bounded recent history and retrieved passages to DeepSeek. It does not expose the API key to the frontend. DeepSeek model: `deepseek-flash`.

## Knowledge library

- `knowledge/mutations:createTextDocument`: admin-only ingestion for extracted `.txt` and `.md` content, stored in Convex Storage and split into overlapping searchable chunks.
- `knowledge/mutations:deleteDocument`: admin-only deletion of a document and its chunks.
- `knowledge/queries:listDocuments` and `getDocument`: authenticated document metadata.
- The internal `knowledge/queries:searchKnowledge` function is used by RAG.

**Current ingestion limitation:** PDF and DOCX binary text extraction is not implemented yet. Do not pass raw binary file contents to `createTextDocument`; extract their text in a future document-processing action first. Initial retrieval is lexical/full-text, not vector similarity search.

## Secrets

Never commit API keys, JWT signing secrets, private keys, or deployment credentials. Configure secrets with `npx convex env set`.

## Data handling

Ward and registration-centre records are aggregate statistics. Do not store individual voter profiles or use these tables for voter targeting.
