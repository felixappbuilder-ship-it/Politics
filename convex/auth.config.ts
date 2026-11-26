import type { AuthConfig } from "convex/server";

const issuer = process.env.TIPO_JWT_ISSUER_URL;
const audience = process.env.TIPO_JWT_AUDIENCE;

if (!issuer || !audience) {
  throw new Error(
    "Missing TIPO_JWT_ISSUER_URL or TIPO_JWT_AUDIENCE environment variable.",
  );
}

export default {
  providers: [
    {
      domain: issuer,
      applicationID: audience,
    },
  ],
} satisfies AuthConfig;
