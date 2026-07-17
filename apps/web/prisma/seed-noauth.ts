/**
 * NO-AUTH self-host seed.
 * Creates the single default user + workspace + short-link domain that the
 * DISABLE_AUTH bypass (lib/auth/utils.ts getSession, get-user-via-token.ts) maps to.
 * Run once after `prisma db push`:  tsx prisma/seed-noauth.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_ID = process.env.NOAUTH_USER_ID || "noauth_default_user";
const EMAIL = process.env.NOAUTH_EMAIL || "user@localhost";
const SLUG = process.env.NOAUTH_WORKSPACE_SLUG || "app";
const WORKSPACE_ID = "ws_noauth_default";
// short-link domain (the Railway "links" domain), e.g. dub-link-production.up.railway.app
const SHORT_DOMAIN = (process.env.SHORT_DOMAIN || "").replace(/^https?:\/\//, "");

async function main() {
  await prisma.user.upsert({
    where: { id: USER_ID },
    update: { defaultWorkspace: SLUG },
    create: {
      id: USER_ID,
      email: EMAIL,
      name: "User",
      emailVerified: new Date(),
      defaultWorkspace: SLUG,
    },
  });

  await prisma.project.upsert({
    where: { id: WORKSPACE_ID },
    update: {},
    create: {
      id: WORKSPACE_ID,
      name: "App",
      slug: SLUG,
      billingCycleStart: 1,
      plan: "business",
      // unlock everything so the single workspace is never limited
      linksLimit: 100_000_000,
      domainsLimit: 10_000,
      usersLimit: 10_000,
      tagsLimit: 10_000,
      foldersLimit: 10_000,
      usageLimit: 1_000_000_000,
    },
  });

  await prisma.projectUsers.upsert({
    where: { userId_projectId: { userId: USER_ID, projectId: WORKSPACE_ID } },
    update: { role: "owner" },
    create: { userId: USER_ID, projectId: WORKSPACE_ID, role: "owner" },
  });

  if (SHORT_DOMAIN) {
    await prisma.domain.upsert({
      where: { slug: SHORT_DOMAIN },
      update: { projectId: WORKSPACE_ID, verified: true, primary: true },
      create: {
        slug: SHORT_DOMAIN,
        projectId: WORKSPACE_ID,
        verified: true,
        primary: true,
      },
    });
  }

  console.log(
    `Seeded no-auth: user=${USER_ID} workspace=${SLUG} domain=${SHORT_DOMAIN || "(none set)"}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
