// CIDR matching for IPv4 and IPv6. Addresses are normalized into 128-bit IPv6
// space, with IPv4 mapped into ::ffff:0:0/96, so both families share one path.

const IPV4_MAPPED_PREFIX = 0xffffn << 32n;

function parseIpv4(address: string): bigint | null {
  const octets = address.split(".");
  if (octets.length !== 4) {
    return null;
  }

  let value = 0n;
  for (const octet of octets) {
    if (!/^\d{1,3}$/.test(octet)) {
      return null;
    }
    const parsed = Number(octet);
    if (parsed > 255) {
      return null;
    }
    value = (value << 8n) | BigInt(parsed);
  }
  return value;
}

function parseIpv6(address: string): bigint | null {
  let text = address;

  // Rewrite an embedded IPv4 tail (::ffff:104.16.0.1) as two hex groups.
  const lastColon = text.lastIndexOf(":");
  if (lastColon === -1) {
    return null;
  }
  const tail = text.slice(lastColon + 1);
  if (tail.includes(".")) {
    const embedded = parseIpv4(tail);
    if (embedded === null) {
      return null;
    }
    text =
      text.slice(0, lastColon + 1) +
      (embedded >> 16n).toString(16) +
      ":" +
      (embedded & 0xffffn).toString(16);
  }

  const halves = text.split("::");
  if (halves.length > 2) {
    return null;
  }
  const leading = halves[0] ? halves[0].split(":") : [];
  const trailing = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const specified = leading.length + trailing.length;
  if (halves.length === 2 ? specified > 8 : specified !== 8) {
    return null;
  }

  const groups = [
    ...leading,
    ...(Array(8 - specified).fill("0") as string[]),
    ...trailing,
  ];

  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) {
      return null;
    }
    value = (value << 16n) | BigInt(parseInt(group, 16));
  }
  return value;
}

/** Returns null if the address is malformed. */
export function parseIp(address: string): bigint | null {
  if (address.includes(":")) {
    return parseIpv6(address);
  }
  const value = parseIpv4(address);
  return value === null ? null : IPV4_MAPPED_PREFIX | value;
}

interface ParsedRange {
  network: bigint;
  mask: bigint;
}

function parseCidr(cidr: string): ParsedRange | null {
  const [address, prefix] = cidr.split("/");
  const value = parseIp(address);
  if (value === null) {
    return null;
  }

  let prefixLength = Number(prefix);
  if (!Number.isInteger(prefixLength) || prefixLength < 0) {
    return null;
  }
  // An IPv4 prefix is measured against the 32-bit address, so shift it past
  // the ::ffff:0:0 mapping.
  if (!address.includes(":")) {
    prefixLength += 96;
  }
  if (prefixLength > 128) {
    return null;
  }

  const mask =
    ((1n << BigInt(prefixLength)) - 1n) << BigInt(128 - prefixLength);
  return { network: value & mask, mask };
}

/** Throws on a malformed range so a typo fails at deploy time. */
export function createIpRangeMatcher(
  cidrs: string[]
): (address: string) => boolean {
  const ranges = cidrs.map((cidr) => {
    const parsed = parseCidr(cidr);
    if (!parsed) {
      throw new Error(`Malformed CIDR range: ${cidr}`);
    }
    return parsed;
  });

  return (address: string): boolean => {
    const value = parseIp(address);
    if (value === null) {
      return false;
    }
    return ranges.some((range) => (value & range.mask) === range.network);
  };
}
