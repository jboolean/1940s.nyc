#!/usr/bin/env node
// Regenerates cloudflareIpRanges.ts from Cloudflare's published lists. CI runs
// this and fails if the working tree changed.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = fileURLToPath(
  new URL("../cloudflareIpRanges.ts", import.meta.url)
);

const SOURCES = {
  v4: "https://www.cloudflare.com/ips-v4",
  v6: "https://www.cloudflare.com/ips-v6",
};

const HEADER = `// GENERATED FILE — DO NOT EDIT BY HAND.
// Run \`npm run sync-cloudflare-ips\` in /edge to refresh from
// ${SOURCES.v4} and ${SOURCES.v6}.
`;

async function fetchRanges(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} responded ${response.status}`);
  }

  const ranges = (await response.text())
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // A truncated or redirected response would otherwise quietly shrink the allowlist.
  if (ranges.length === 0) {
    throw new Error(`${url} returned no ranges`);
  }
  for (const range of ranges) {
    if (!/^[0-9a-f.:]+\/\d{1,3}$/i.test(range)) {
      throw new Error(`${url} returned an unexpected entry: ${range}`);
    }
  }

  return ranges;
}

function formatArray(name, ranges) {
  const entries = ranges.map((range) => `  "${range}",`).join("\n");
  return `export const ${name} = [\n${entries}\n];\n`;
}

const [v4, v6] = await Promise.all([
  fetchRanges(SOURCES.v4),
  fetchRanges(SOURCES.v6),
]);

const contents = [
  HEADER,
  formatArray("CLOUDFLARE_IPV4_RANGES", v4),
  formatArray("CLOUDFLARE_IPV6_RANGES", v6),
  `export const CLOUDFLARE_RANGES = [\n  ...CLOUDFLARE_IPV4_RANGES,\n  ...CLOUDFLARE_IPV6_RANGES,\n];\n`,
].join("\n");

await writeFile(OUTPUT_PATH, contents);

console.log(
  `Wrote ${v4.length} IPv4 and ${v6.length} IPv6 ranges to ${OUTPUT_PATH}`
);
