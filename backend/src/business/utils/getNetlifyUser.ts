import axios from 'axios';
import { UserData } from 'gotrue-js';

export default async function getNetfilyUser(
  authToken: string
): Promise<UserData> {
  const userResp = await axios.get<UserData>(
    'https://1940s.nyc/.netlify/identity/user',
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  return userResp.data;
}
