import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (name) => JSON.parse(readFileSync(join(root, name), "utf8"));
const vendor = readJson("vendor.json");
const manifest = readJson("manifest.github.json");
const provider = readJson("express.github.json").aiostreams_github_direct_v2;

function interpolate(template, values) {
  return Object.entries(values).reduce(
    (output, [key, value]) => output.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function atPath(value, path) {
  return path.split(".").reduce((current, key) => current?.[key], value);
}

function mapResult(format, result) {
  const mapped = {};
  for (const [field, path] of Object.entries(format)) {
    if (field === "results" || field.endsWith(":ops")) continue;
    let value = atPath(result, path);
    for (const operation of format[`${field}:ops`] ?? []) {
      if (operation.name === "regex" && value != null) {
        const match = new RegExp(operation.params[0]).exec(String(value));
        if (match) value = match[1] ?? match[0];
      }
    }
    mapped[field] = value;
  }
  return mapped;
}

test("vendor installs the canonical manifest", () => {
  const expected = "https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/main/manifest.github.json";
  assert.equal(vendor.packages.length, 1);
  assert.equal(vendor.version, 3);
  assert.equal(vendor.packages[0].name, "AIOStreams Nightly (GitHub Direct v2)");
  assert.equal(vendor.packages[0].enabled, true);
  assert.equal(vendor.packages[0].manifest, expected);
  assert.deepEqual(vendor.defaults.packages, [expected]);
});

test("authenticated requests never use a third-party cache server", () => {
  assert.deepEqual(vendor.cacheServers, []);
  assert.equal("cacheServer" in vendor.defaults, false);
});

test("fresh GitHub package identity cannot collide with stale installs", () => {
  assert.equal(manifest.id, "com.cxsmo.syncler.aiostreams.github.direct.v2");
  assert.equal(
    manifest.url,
    "https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/main/express.github.json",
  );
});

test("managed account injects Basic auth only into Midnight nightly", () => {
  const account = manifest.accounts[0];
  assert.equal(account.auth.type, "basic");
  assert.deepEqual(account.auth.allowedDomains, ["aiostreamsfortheweebs.midnightignite.me"]);
  assert.equal(account.auth.inject.headers.Authorization, "Basic {managedAccounts.aio.basicToken}");
  assert.equal(account.verification.method, "GET");
  assert.equal(account.verification.extract.username.value, "$.data.userData.uuid");

  const allowedHost = account.auth.allowedDomains[0];
  assert.equal(new URL(account.verification.url).hostname, allowedHost);
  assert.notEqual(new URL("https://aiostreamsfortheweebsstable.midnightignite.me").hostname, allowedHost);
  assert.notEqual(new URL(`https://${allowedHost}.example.org`).hostname, allowedHost);
});

test("managed Basic token has the AIOStreams uuid:password shape", () => {
  const uuid = "00000000-0000-4000-8000-000000000000";
  const password = "test-password";
  const basicToken = Buffer.from(`${uuid}:${password}`, "utf8").toString("base64");
  assert.equal(Buffer.from(basicToken, "base64").toString("utf8"), `${uuid}:${password}`);
});

test("movie query uses the IMDb ID and direct-result requirements", () => {
  const query = interpolate(provider.movie.query, { imdbId: "tt0111161" });
  assert.equal(
    query,
    "/api/v1/search?type=movie&id=tt0111161&requiredFields=url&requiredFields=filename",
  );
});

test("episode and anime queries use Stremio series IDs", () => {
  const values = { showImdbId: "tt0944947", season: 1, episode: 2 };
  const expected =
    "/api/v1/search?type=series&id=tt0944947:1:2&requiredFields=url&requiredFields=filename";
  assert.equal(interpolate(provider.episode.query, values), expected);
  assert.equal(interpolate(provider.anime.query, values), expected);
});

test("AIOStreams response maps to a playable Syncler direct source", () => {
  const apiResponse = {
    success: true,
    data: {
      results: [
        {
          url: "https://stream.example.net/video/abc123.mkv",
          filename: "Example.Movie.2026.1080p.WEB-DL.mkv",
          size: 4_294_967_296,
        },
      ],
      filtered: 3,
      errors: [],
      statistics: [],
    },
  };

  const results = atPath(apiResponse, provider.json_format.results);
  assert.equal(results.length, 1);
  assert.deepEqual(mapResult(provider.json_format, results[0]), {
    url: "https://stream.example.net/video/abc123.mkv",
    title: "Example.Movie.2026.1080p.WEB-DL.mkv",
    size: 4_294_967_296,
    playbackFileName: "Example.Movie.2026.1080p.WEB-DL.mkv",
    playbackFileSize: 4_294_967_296,
    host: "stream.example.net",
  });
});

test("package does not require HEAD requests", () => {
  assert.equal(manifest.accounts[0].verification.method, "GET");
  for (const kind of ["movie", "episode", "anime"]) {
    assert.match(provider[kind].query, /^\/api\/v1\/search\?/);
  }
});
