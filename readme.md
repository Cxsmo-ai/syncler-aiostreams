# AIOStreams for Syncler

A static Syncler Express provider package that queries Midnight's **AIOStreams Nightly** Search API. Authentication is handled by Syncler's provider-package managed account system, so this project needs no bridge, VPS, worker, proxy, or other hosted backend.

## Install

Add this vendor URL in Syncler:

```text
https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/main/vendor.json
```

GitHub Pages also serves the same file:

```text
https://cxsmo-ai.github.io/syncler-aiostreams/vendor.json
```

Install **AIOStreams for Syncler** from that vendor. On a Syncler version that supports provider-package managed accounts, open:

```text
Settings > Third-party accounts > Provider package managed accounts
```

Add the **Midnight's AIOStreams Nightly** account. Use:

- Username: your AIOStreams UUID
- Password: your AIOStreams password/token

If starting from an AIOStreams Stremio manifest, those are the two values in:

```text
https://aiostreamsfortheweebs.midnightignite.me/stremio/<uuid>/<password>/manifest.json
```

After adding the account on a phone, restart Syncler on a TV device so the managed account synchronizes.

## How it works

```text
vendor.json
  -> manifest.json
     -> Syncler managed Basic account
     -> express.json
        -> GET Midnight nightly /api/v1/search
        -> map AIOStreams direct HTTPS results into Syncler sources
```

Syncler injects `Authorization: Basic base64(uuid:password)` only for the explicitly allowed Midnight nightly domain. Credentials are stored by Syncler and are never placed in this repository or in an install URL.

The provider requests only results with both `url` and `filename`. This intentionally excludes unresolved torrents, informational cards, and other non-playable Search API entries. Configure debrid or another direct-stream source in AIOStreams if you want those sources returned to Syncler.

## Fixed AIOStreams instance

This package is intentionally locked to Midnight's nightly instance:

```text
https://aiostreamsfortheweebs.midnightignite.me
```

The allowed-domain restriction prevents managed credentials from being forwarded to any other host. Supporting another AIOStreams instance requires a separate package/account declaration rather than a user-editable URL.

## Repository files

- `vendor.json` — vendor URL entered in Syncler.
- `manifest.json` — package metadata and managed-account declaration.
- `express.json` — movie, episode, and anime Search API queries and direct-source mappings.
- `scripts/validate-package.mjs` — validates the complete static package contract.
- `scripts/check-no-secrets.mjs` — rejects tokenized AIOStreams URLs and embedded credentials.
- `scripts/smoke-live.mjs` — read-only smoke test for Midnight's live nightly endpoints.
- `test/package.test.mjs` — deterministic managed-account, query, and response-mapping tests.

## Test locally

Node.js 20 or newer is sufficient; the repository has no runtime dependencies.

```bash
npm test
npm run smoke:live
```

The default live smoke test does not use credentials. It confirms that the configure page is reachable and both protected API routes reject anonymous calls as expected.

For an optional authenticated end-to-end test, provide credentials only through temporary environment variables:

```bash
AIOSTREAMS_UUID='<uuid>' AIOSTREAMS_PASSWORD='<password>' npm run smoke:live
```

The script never prints those values. Do not commit them, paste them into an issue, or add them to a vendor URL.

GitHub Actions runs validation, contract tests, the unauthenticated live smoke test, and the secret scan on every push and pull request. It also runs the live smoke test daily so upstream nightly changes are detected.

## Limitations

- Midnight's instance is operated independently and its availability or policy may change.
- Syncler must support provider-package managed accounts and `json_format` direct sources.
- Only direct HTTPS results are mapped. Torrent hashes, NZBs, external action cards, and results needing custom request headers are not emitted by this package.

## License

MIT
