const input = process.argv[2];

if (!input) {
  console.error("Usage: node scripts/extract-manifest-account.mjs <AIOStreams manifest URL>");
  process.exit(1);
}

let url;
try {
  url = new URL(input);
} catch {
  console.error("Invalid URL.");
  process.exit(1);
}

const parts = url.pathname.split("/").filter(Boolean);
const stremioIndex = parts.indexOf("stremio");
const uuid = stremioIndex >= 0 ? parts[stremioIndex + 1] : "";
const token = stremioIndex >= 0 ? parts[stremioIndex + 2] : "";
const finalPart = parts[parts.length - 1] || "";

if (!uuid || !token || finalPart !== "manifest.json") {
  console.error("Expected URL shape: https://host/stremio/<uuid>/<token>/manifest.json");
  process.exit(1);
}

console.log("Syncler account values:");
console.log("Username:", uuid);
console.log("Password:", token);
console.log("");
console.log("These values were only printed. They were not saved.");
