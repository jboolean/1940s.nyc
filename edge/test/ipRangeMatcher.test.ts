import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLOUDFLARE_RANGES } from "../cloudflareIpRanges.ts";
import { createIpRangeMatcher, parseIp } from "../ipRangeMatcher.ts";

const isCloudflareIp = createIpRangeMatcher(CLOUDFLARE_RANGES);

describe("parseIp", () => {
  it("maps IPv4 into IPv6 space", () => {
    assert.equal(parseIp("0.0.0.0"), 0xffff00000000n);
    assert.equal(parseIp("255.255.255.255"), 0xffffffffffffn);
  });

  it("expands compressed IPv6", () => {
    assert.equal(parseIp("::1"), 1n);
    assert.equal(parseIp("2400:cb00::"), 0x2400cb00n << 96n);
    assert.equal(parseIp("2400:cb00:0:0:0:0:0:0"), parseIp("2400:cb00::"));
  });

  it("reads IPv4-mapped IPv6 as the same address as its IPv4 form", () => {
    assert.equal(parseIp("::ffff:104.16.0.1"), parseIp("104.16.0.1"));
  });

  it("rejects malformed addresses", () => {
    for (const address of [
      "",
      "1.2.3",
      "1.2.3.4.5",
      "256.0.0.1",
      "1.2.3.-1",
      "abc",
      "1::2::3",
      "12345::",
      "gggg::",
      "1:2:3:4:5:6:7",
    ]) {
      assert.equal(parseIp(address), null, `expected null for "${address}"`);
    }
  });
});

describe("createIpRangeMatcher", () => {
  it("matches addresses at both edges of a range", () => {
    // 104.16.0.0/13 spans 104.16.0.0 - 104.23.255.255
    assert.equal(isCloudflareIp("104.16.0.0"), true);
    assert.equal(isCloudflareIp("104.23.255.255"), true);
    assert.equal(isCloudflareIp("104.15.255.255"), false);
    assert.equal(isCloudflareIp("104.24.0.0"), true); // covered by 104.24.0.0/14
    assert.equal(isCloudflareIp("104.28.0.0"), false);
  });

  it("matches a /29 IPv6 range that is not hex-digit aligned", () => {
    // 2a06:98c0::/29 spans 2a06:98c0:: - 2a06:98c7:ffff:...
    assert.equal(isCloudflareIp("2a06:98c0::1"), true);
    assert.equal(isCloudflareIp("2a06:98c7:ffff:ffff:ffff:ffff:ffff:ffff"), true);
    assert.equal(isCloudflareIp("2a06:98c8::"), false);
    assert.equal(isCloudflareIp("2a06:98bf:ffff::"), false);
  });

  it("does not confuse the IPv4 and IPv6 families", () => {
    // 2400:cb00::/32 must not match anything in IPv4-mapped space
    assert.equal(isCloudflareIp("36.0.203.0"), false);
  });

  it("rejects non-Cloudflare and malformed addresses", () => {
    assert.equal(isCloudflareIp("8.8.8.8"), false);
    assert.equal(isCloudflareIp("18.172.122.93"), false);
    assert.equal(isCloudflareIp("not-an-ip"), false);
    assert.equal(isCloudflareIp(""), false);
  });

  it("throws on a malformed range so typos fail at deploy time", () => {
    assert.throws(() => createIpRangeMatcher(["10.0.0.0/33"]), /Malformed/);
    assert.throws(() => createIpRangeMatcher(["10.0.0.0"]), /Malformed/);
    assert.throws(() => createIpRangeMatcher(["nonsense/8"]), /Malformed/);
  });
});
