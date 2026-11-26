# TIPO HUB Backend

Convex backend for TIPO HUB.

## Stack

- Convex database, queries, mutations, and actions
- External JWT issuer; Convex verifies signed access tokens
- DeepSeek for AI generation (server-side actions only)
- Convex full-text search as the first RAG retrieval layer

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

5. Run type checking:

   ```bash
   npm run typecheck
   ```

## First administrator

The external issuer creates and authenticates the administrator identity. Then invoke the internal function `users/mutations:bootstrapFirstAdmin` once from trusted Convex dashboard/internal tooling, passing the exact `tokenIdentifier` from that identity and the administrator's name. It refuses to run if any user profile already exists.

After bootstrap, create additional staff profiles through the admin-only `users/mutations:createUser` mutation. Do not add public self-registration or client-side role assignment.

## Secrets

Never commit API keys, JWT signing secrets, private keys, or deployment credentials.

Configure the DeepSeek key on the Convex deployment:

```bash
npx convex env set DEEPSEEK_API_KEY YOUR_SECRET
```

AI requests must be made from Convex actions. Never expose the key to the browser.

## Current implementation status

- Initial schema and authentication foundation are in place.
- User profile provisioning and administrator authorization are implemented.
- AI, document processing/RAG actions, meetings, action register, dashboard, and ward queries are the next feature implementation stages.

## Data handling

Ward and registration-centre records are aggregate statistics. Do not store individual voter profiles or use these tables for voter targeting.
