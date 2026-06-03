# AIOStreams Syncler Vendor

Syncler v2 vendor for AIOStreams using the hosted AIOStreams REST API. This package is static: users add the vendor in Syncler and do not need to run Providra, Node, Android, or any self-hosted bridge.

## Install

Use this Syncler v2 vendor URL:

```
https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/main/vendor.json
```

GitHub Pages may lag after a release. The Pages URL is:

```
https://cxsmo-ai.github.io/syncler-aiostreams/vendor.json
```

The vendor points Syncler to this package manifest:

```
https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/main/manifest.json
```

The package manifest points Syncler to this package data:

```
https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/main/express.json
```

You need an AIOStreams UUID and token in Syncler. The package declares a Syncler managed account named `aio` and injects HTTP Basic auth into AIOStreams API requests as `base64(uuid:token)`.

This package is configured for the AioStreams instance at:

```
https://aiostreamsfortheweebsstable.midnightignite.me
```

## Files

- `vendor.json` - Syncler v2 vendor URL to add in Syncler.
- `manifest.json` - Syncler express package manifest.
- `express.json` - Syncler express package data using AIOStreams `/api/v1/search`.

There is no separate config page. Add the vendor in Syncler, install the package, then enter your AIOStreams UUID as the username and your AIOStreams token as the password value in Syncler's managed account prompt.

If you only have an AIOStreams Stremio manifest URL, use the two path pieces after `/stremio/`:

```
https://aiostreamsfortheweebsstable.midnightignite.me/stremio/<uuid>/<token>/manifest.json
```

In Syncler:

- Username: `<uuid>`
- Password: `<token>`

You can extract those values locally without saving them:

```
node scripts/extract-manifest-account.mjs "<your manifest URL>"
```

Do not commit real AIOStreams manifest URLs or encoded account paths to this repo. Run this check before pushing:

```
node scripts/check-no-secrets.mjs
```

## Scope

This repo intentionally supports AIOStreams/Stremio results only. It does not include Providra's local server, Android wrapper, or Nuvio plugin bridge.
