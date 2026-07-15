import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const nightlyHost = "aiostreamsfortheweebs.midnightignite.me";
const nightlyBase = `https://${nightlyHost}`;
const repoBase = "https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/main";

function readJson(name) {
  return JSON.parse(readFileSync(join(root, name), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const vendor = readJson("vendor.json");
const manifest = readJson("manifest.github.json");
const express = readJson("express.github.json");
const providerEntries = Object.entries(express);
const provider = express.aiostreams_github_direct_v2;
const accounts = Array.isArray(manifest.accounts) ? manifest.accounts : [];
const account = accounts[0];

assert(vendor.packages?.length === 1, "vendor.json must expose exactly one package");
assert(vendor.version === 3, "vendor version must identify the GitHub-only v2 refresh");
assert(vendor.packages[0].manifest === `${repoBase}/manifest.github.json`, "vendor package manifest URL is wrong");
assert(vendor.packages[0].name === "AIOStreams Nightly (GitHub Direct v2)", "vendor package name is missing");
assert(vendor.packages[0].enabled === true, "vendor package must be enabled");
assert(vendor.defaults?.packages?.length === 1, "vendor defaults must install exactly one package");
assert(vendor.defaults.packages[0] === vendor.packages[0].manifest, "vendor default package must match the listed package");
assert(Array.isArray(vendor.cacheServers) && vendor.cacheServers.length === 0, "authenticated requests must not use a third-party cache server");
assert(!("cacheServer" in vendor.defaults), "authenticated requests must not set a default cache server");
assert(manifest.type === "express", "manifest.github.json must declare an Express package");
assert(manifest.id === "com.cxsmo.syncler.aiostreams.github.direct.v2", "fresh package ID is wrong");
assert(Number.isSafeInteger(manifest.version) && manifest.version > 0, "manifest version must be a positive integer");
assert(manifest.url === `${repoBase}/express.github.json`, "manifest package-data URL is wrong");
assert(accounts.length === 1, "manifest must declare exactly one managed account");
assert(account.alias === "aio", "managed account alias must be aio");
assert(account.branding?.website === "https://midnightignite.me", "branding website must use the primary domain");
assert(account.auth?.type === "basic", "AIOStreams must use managed Basic authentication");
assert(account.auth?.allowedDomains?.length === 1, "credentials must be restricted to one domain");
assert(account.auth.allowedDomains[0] === nightlyHost, "credentials are not restricted to Midnight nightly");
assert(account.auth.inject?.headers?.Authorization === "Basic {managedAccounts.aio.basicToken}", "managed Basic header injection is wrong");
assert(account.verification?.url === `${nightlyBase}/api/v1/user`, "account verification URL is wrong");
assert(account.verification?.method === "GET", "account verification must use GET, not HEAD");
assert(account.verification?.responseType === "json", "account verification must expect JSON");
assert(account.verification?.extract?.username?.value === "$.data.userData.uuid", "verification UUID extraction is wrong");
assert(providerEntries.length === 1 && provider, "express.github.json must expose exactly one provider");
assert(provider.enabled === true, "AIOStreams provider must be enabled");
assert(provider.base_url === nightlyBase, "provider must use Midnight nightly");
assert(provider.response_type === "json", "Search API response type must be JSON");

for (const kind of ["movie", "episode", "anime"]) {
  const query = provider[kind]?.query;
  assert(typeof query === "string" && query.startsWith("/api/v1/search?"), `${kind} must call the Search API`);
  assert(query.includes("requiredFields=url"), `${kind} must require a playable URL`);
  assert(query.includes("requiredFields=filename"), `${kind} must require a filename`);
  assert(!query.includes("format=true"), `${kind} should avoid unnecessary Stremio formatting work`);
}

assert(provider.movie.query.includes("type=movie&id={imdbId}"), "movie query must use imdbId");
assert(provider.episode.query.includes("type=series&id={showImdbId}:{season}:{episode}"), "episode query must use show IMDb ID and season/episode");
assert(provider.anime.query.includes("type=series&id={showImdbId}:{season}:{episode}"), "anime query must use show IMDb ID and season/episode");
assert(provider.json_format?.results === "data.results", "Search API result path is wrong");
assert(provider.json_format.url === "url", "direct URL mapping is required");
assert(provider.json_format.title === "filename", "source title must use the filename");
assert(provider.json_format.size === "size", "source size mapping is required");
assert(provider.json_format.playbackFileName === "filename", "playback filename mapping is required");
assert(provider.json_format.playbackFileSize === "size", "playback file size mapping is required");
assert(provider.json_format.host === "url", "direct source host must be derived from its URL");
assert(Array.isArray(provider.json_format["host:ops"]), "host extraction operation is required");
assert(provider.json_format["host:ops"].length === 1, "host extraction must have exactly one operation");
assert(provider.json_format["host:ops"][0].name === "regex", "host extraction must use a regex operation");
assert(!JSON.stringify({ vendor, manifest, express }).includes("aiostreamsfortheweebsstable"), "stable host must not appear in package data");

console.log("Static Syncler package contract is valid.");
