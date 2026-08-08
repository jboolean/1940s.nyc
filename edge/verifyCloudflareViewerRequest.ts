import { CloudFrontRequestHandler } from "aws-lambda";
import { CLOUDFLARE_RANGES } from "./cloudflareIpRanges";
import { createIpRangeMatcher } from "./ipRangeMatcher";

/**
 * Rejects requests that did not come through Cloudflare, so nobody can bypass it
 * by hitting the CloudFront domain directly.
 *
 * Runs on viewer-request, not origin-request: origin-request is skipped on a
 * cache hit, so a direct requester would still be served cached objects.
 */

/**
 * "log-only" logs what it would have rejected and lets the request through.
 * Deploy in "log-only" and check the logs first — if this distribution is not
 * yet fronted by Cloudflare, "enforce" takes every photo offline immediately.
 *
 * Lambda@Edge has no environment variables, so changing this needs a redeploy.
 */
const MODE: "enforce" | "log-only" = "log-only";

const isCloudflareIp = createIpRangeMatcher(CLOUDFLARE_RANGES);

export const handler: CloudFrontRequestHandler = async (event) => {
  const request = event.Records[0].cf.request;

  if (isCloudflareIp(request.clientIp)) {
    return request;
  }

  console.warn("Request did not originate from Cloudflare", {
    clientIp: request.clientIp,
    uri: request.uri,
    mode: MODE,
  });

  if (MODE === "log-only") {
    return request;
  }

  return {
    status: "403",
    statusDescription: "Forbidden",
    body: "Direct access is not permitted.",
    headers: {
      "cache-control": [
        {
          key: "Cache-Control",
          value: "no-store",
        },
      ],
      "content-type": [
        {
          key: "Content-Type",
          value: "text/plain; charset=utf-8",
        },
      ],
    },
  };
};
