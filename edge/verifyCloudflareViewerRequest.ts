import { CloudFrontRequestHandler } from "aws-lambda";
import { CLOUDFLARE_RANGES } from "./cloudflareIpRanges";
import { createIpRangeMatcher } from "./ipRangeMatcher";

// Rejects requests that did not come through Cloudflare. On viewer-request
// rather than origin-request, which is skipped on cache hits.

// "enforce" 403s. Don't flip it until this distribution is actually behind
// Cloudflare — Lambda@Edge has no env vars, so it needs a redeploy either way.
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
