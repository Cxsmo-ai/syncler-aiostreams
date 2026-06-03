import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function readJson(name) {
  return JSON.parse(readFileSync(join(root, name), "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const vendor = readJson("vendor.json");
const manifest = readJson("manifest.json");
const express = readJson("express.json");
const provider = express.aiostreams_direct;
const account = Array.isArray(manifest.accounts) ? manifest.accounts[0] : null;

assert(vendor.packages && vendor.packages.length === 1, "vendor.json should expose exactly one package.");
assert(manifest.type === "express", "manifest.json must be an express package.");
assert(manifest.url === "https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/main/express.json", "manifest.json should point at main/express.json.");
assert(account && account.alias === "aio", "manifest.json must declare managed account alias aio.");
assert(account.auth && account.auth.type === "basic", "AIOStreams account must use basic auth.");
assert(account.auth.allowedDomains && account.auth.allowedDomains.length === 1, "Only the fixed AIOStreams host should receive credentials.");
assert(account.auth.allowedDomains[0] === "aiostreamsfortheweebsstable.midnightignite.me", "Unexpected allowed domain.");
assert(account.auth.inject.headers.Authorization === "Basic {managedAccounts.aio.basicToken}", "Authorization header injection is wrong.");
assert(provider, "express.json must include aiostreams_direct provider.");
assert(provider.base_url === "https://aiostreamsfortheweebsstable.midnightignite.me", "Provider base_url is wrong.");
assert(provider.movie.query.includes("id={imdbId}"), "Movie query must use imdbId directly.");
assert(provider.episode.query.includes("id={showImdbId}:{season}:{episode}"), "Episode query must use showImdbId/season/episode.");
assert(provider.movie.query.includes("requiredFields=url"), "Movie query must require url results.");
assert(provider.episode.query.includes("requiredFields=url"), "Episode query must require url results.");
assert(provider.json_format.url === "url", "Direct URL mapping is required.");
assert(provider.json_format.host === "url", "Host must be derived from URL.");
assert(provider.json_format.title === "filename", "Use filename as the most compatible direct-link title.");
assert(Array.isArray(provider.json_format["host:ops"]), "Host regex op is required.");
assert(!Object.prototype.hasOwnProperty.call(provider.json_format, "seeds"), "Do not map torrent-only seed fields for direct-link compatibility.");
assert(!Object.prototype.hasOwnProperty.call(provider.json_format, "playbackFileName"), "Keep v1 direct-link mapping minimal until Syncler playback is proven.");
assert(!Object.prototype.hasOwnProperty.call(provider.json_format, "playbackFileSize"), "Do not map playbackFileSize until file-size semantics are proven.");

console.log("Package JSON validation passed.");
