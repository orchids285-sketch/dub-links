import { UserProps } from "@/lib/types";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function getUserViaToken(req: NextRequest) {
  // NO-AUTH self-host: skip the login gate, always resolve the seeded default user.
  if (process.env.DISABLE_AUTH === "true") {
    return {
      id: process.env.NOAUTH_USER_ID || "noauth_default_user",
      name: "User",
      email: process.env.NOAUTH_EMAIL || "user@localhost",
      defaultWorkspace: process.env.NOAUTH_WORKSPACE_SLUG || "app",
    } as unknown as UserProps;
  }
  const session = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as {
    email?: string;
    user?: UserProps;
  };

  return session?.user;
}
