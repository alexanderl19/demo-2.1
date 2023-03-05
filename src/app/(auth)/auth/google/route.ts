import { redirect } from "next/navigation";
import WorkOS from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientID = process.env.WORKOS_CLIENT_ID;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!clientID) throw new Error("");

  const provider = "GoogleOAuth";

  const redirectURI =
    process.env.NODE_ENV == "development"
      ? "http://localhost:3000/auth/callback"
      : "https://staging.zotmeet.com/auth/callback";

  const authorizationUrl = workos.sso.getAuthorizationURL({
    provider,
    redirectURI,
    clientID,
  });

  redirect(authorizationUrl);
}
