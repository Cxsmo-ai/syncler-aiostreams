import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const express = JSON.parse(readFileSync(join(root, "express.json"), "utf8"));
const base = express.aiostreams_direct.base_url;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, init = {}, acceptedStatuses = [200]) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`${base}${path}`, {
        ...init,
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
      if (acceptedStatuses.includes(response.status)) return response;
      if (response.status < 500) {
        throw new Error(`${path} returned HTTP ${response.status}`);
      }
      lastError = new Error(`${path} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
  }
  throw lastError;
}

const configure = await request("/stremio/configure");
assert((configure.headers.get("content-type") ?? "").includes("text/html"), "configure endpoint did not return HTML");

const anonymousSearch = await request(
  "/api/v1/search?type=movie&id=tt0111161&requiredFields=url&requiredFields=filename",
  {},
  [401],
);
assert((anonymousSearch.headers.get("content-type") ?? "").includes("application/json"), "Search API challenge was not JSON");

const anonymousUser = await request("/api/v1/user", {}, [400, 401]);
assert((anonymousUser.headers.get("content-type") ?? "").includes("application/json"), "user API challenge was not JSON");

const uuid = process.env.AIOSTREAMS_UUID;
const password = process.env.AIOSTREAMS_PASSWORD;
assert(Boolean(uuid) === Boolean(password), "Set both AIOSTREAMS_UUID and AIOSTREAMS_PASSWORD, or neither");

if (uuid && password) {
  const authorization = `Basic ${Buffer.from(`${uuid}:${password}`, "utf8").toString("base64")}`;
  const headers = { Authorization: authorization };
  const userResponse = await request("/api/v1/user", { headers });
  const userJson = await userResponse.json();
  assert(userJson?.success === true, "authenticated user verification did not succeed");
  assert(userJson?.data?.userData?.uuid === uuid, "authenticated user verification returned a different UUID");

  const searchResponse = await request(
    "/api/v1/search?type=movie&id=tt0111161&requiredFields=url&requiredFields=filename",
    { headers },
  );
  const searchJson = await searchResponse.json();
  assert(searchJson?.success === true, "authenticated Search API request did not succeed");
  assert(Array.isArray(searchJson?.data?.results), "authenticated Search API response has no results array");
  console.log(`Authenticated live smoke passed (${searchJson.data.results.length} direct results).`);
} else {
  console.log("Unauthenticated live smoke passed; protected routes rejected anonymous requests.");
}
