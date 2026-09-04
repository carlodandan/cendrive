# Scripts

## `tauri-build.mjs`
Run through `pnpm build`. Wraps `tauri build` and decides how to sign from the
environment: `CERTIFICATE_THUMBPRINT` signs from the Windows certificate store,
`CERTIFICATE_PASSWORD` signs with a `.pfx`, and neither builds unsigned. See
`.env.sample`.

`TAURI_SIGNING_PRIVATE_KEY` is the updater key from `signkey/`, a separate thing
from the certificate: it signs the manifest an installed copy checks, not the
installer Windows checks. `src-tauri/tauri.conf.json` asks for updater artifacts
on every build, so the wrapper stops early when that variable is missing rather
than let the bundler fail after the Rust build.

The release workflow runs it too, through `tauri-action`'s `tauriScript`, so a
CI build signs the same way a local one does.

## `sign.cmd`
Called by `tauri-build.mjs` once per artifact when signing with a `.pfx`. Not
meant to be run by hand.

## `region_format.py`
One-off formatter for the `.json` files in `src/data/` and `src/data/lgu/`, taken
from [bettergov](https://github.com/bettergovph/bettergov). Not part of the
build.
