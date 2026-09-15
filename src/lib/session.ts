import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { AuthUser } from "./permissions";

const SESSION_COOKIE = "closing_session_token";

/**
 * Retrieves the currently authenticated user on the server.
 * Returns null if no valid authenticated session is found.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.active) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    authorizedBranchIds: user.authorizedBranchIds,
    active: user.active,
  };
}

/**
 * Sets the authenticated user session cookie upon valid credential verification.
 */
export async function setCurrentUser(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days session
  });
}

/**
 * Clears the session cookie on logout.
 */
export async function clearCurrentUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
