import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";
import { randomInt } from "node:crypto";
import { DubApiError } from "../api/errors";
import { authOptions } from "./options";

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    isMachine: boolean;
    defaultWorkspace?: string;
    defaultPartnerId?: string;
  };
}

// NO-AUTH self-host: when DISABLE_AUTH is set we skip the login gate entirely and
// act as a single seeded default user/workspace (see prisma/seed-noauth.ts). Every
// auth path funnels through getSession(), so this one override makes the whole app
// authless without touching the 90+ withWorkspace/withSession routes.
export const NOAUTH = process.env.DISABLE_AUTH === "true";
export const NOAUTH_USER_ID = process.env.NOAUTH_USER_ID || "noauth_default_user";
export const NOAUTH_WORKSPACE_SLUG = process.env.NOAUTH_WORKSPACE_SLUG || "app";

export const getSession = async () => {
  if (NOAUTH) {
    return {
      user: {
        id: NOAUTH_USER_ID,
        name: "User",
        email: process.env.NOAUTH_EMAIL || "user@localhost",
        isMachine: false,
        defaultWorkspace: NOAUTH_WORKSPACE_SLUG,
      },
    } as Session;
  }
  return getServerSession(authOptions) as Promise<Session>;
};

export const getAuthTokenOrThrow = (
  req: Request | NextRequest,
  type: "Bearer" | "Basic" = "Bearer",
) => {
  const authorizationHeader = req.headers.get("Authorization");

  if (!authorizationHeader) {
    throw new DubApiError({
      code: "bad_request",
      message:
        "Misconfigured authorization header. Did you forget to add 'Bearer '? Learn more: https://d.to/auth",
    });
  }

  return authorizationHeader.replace(`${type} `, "");
};

export function generateOTP() {
  const randomNumber = randomInt(0, 1000000);

  // Pad the number with leading zeros if necessary to ensure it is always 6 digits
  return randomNumber.toString().padStart(6, "0");
}
