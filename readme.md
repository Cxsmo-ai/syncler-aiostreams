# AioStreams Syncler Vendor

Syncler vendor copied from JakedUp's repo layout and switched to the AioStreams provider config.

## Install

Use this Syncler v2 vendor URL:

```
https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/refs/heads/main/vendor.json
```

The vendor points Syncler to this package manifest:

```
https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/refs/heads/main/manifest.json
```

The package manifest points Syncler to this package data:

```
https://raw.githubusercontent.com/Cxsmo-ai/syncler-aiostreams/refs/heads/main/express.json
```

You need an AioStreams account in Syncler because the package uses the `managedAccounts.aio` username/password placeholders.

This package is configured for the AioStreams instance at:

```
https://aiostreamsfortheweebsstable.midnightignite.me
```

## Files

- `vendor.json` - Syncler v2 vendor URL to add in Syncler.
- `manifest.json` - Syncler express package manifest.
- `express.json` - Syncler express package data.
- `package.json` - Backwards-compatible copy of the express package data.
- `@config/` - lightweight install page based on the JakedUp repo structure.
