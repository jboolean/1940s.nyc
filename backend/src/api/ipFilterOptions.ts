import type * as express from 'express';
import type { IpFilterOptions } from 'express-ipfilter';

/**
 * express-ipfilter ignores req.ip and reads the socket address itself, which is
 * now a Cloudflare edge IP. Point it back at req.ip, which cloudflareIp() and
 * the `trust proxy` setting resolve to the real client.
 */
const ipFilterOptions: IpFilterOptions = {
  mode: 'allow',
  detectIp: (req: express.Request): string => req.ip ?? '',
};

export default ipFilterOptions;
