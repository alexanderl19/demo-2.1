import { serialize } from "cookie";
import WorkOS from "@workos-inc/node";
import { prisma } from "@/src/lib/prisma/client";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientID = process.env.WORKOS_CLIENT_ID;

export const GET = async (request: Request) => {
  if (!clientID) throw new Error("");

  const code = new URL(request.url).searchParams.get("code");
  if (!code) throw new Error("");

  const { profile } = await workos.sso.getProfileAndToken({
    code,
    clientID,
  });

  const session = await prisma.session.create({
    data: { profileId: profile.id },
  });

  return new Response(undefined, {
    status: 302,
    headers: {
      location: "/",
      "set-cookie": serialize("session", session.id, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        secure: true,
      }),
    },
  });
};
