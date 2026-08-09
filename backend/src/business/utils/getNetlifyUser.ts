import axios from 'axios';
import { UserData } from 'gotrue-js';

// Direct Netlify origin, bypassing our Cloudflare proxy. This is a
// server-to-server call, and Cloudflare's Bot Fight Mode (can't be exempted
// via rules on our plan) intermittently blocks non-browser requests from
// Lambda to the public domain, which surfaced as spurious "Invalid token"
// errors on admin routes.
const NETLIFY_ORIGIN = process.env.INTERNAL_FRONTEND_BASE_URL as string;

export default async function getNetfilyUser(
  authToken: string
): Promise<UserData> {
  const userResp = await axios.get<UserData>(
    new URL('/.netlify/identity/user', NETLIFY_ORIGIN).toString(),
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  return userResp.data;
}
