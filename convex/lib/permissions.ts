import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getAuthenticatedUser } from "./auth";

type AuthContext = QueryCtx | MutationCtx;

export async function requireAdmin(ctx: AuthContext) {
  const user = await getAuthenticatedUser(ctx);

  if (user.role !== "admin") {
    throw new Error("Forbidden: administrator access required");
  }

  return user;
}
