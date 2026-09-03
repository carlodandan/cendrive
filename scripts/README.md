# Scripts

## `tauri-build.mjs`
Run through `npm run build`. Wraps `tauri build` and decides how to sign from the
environment: `CERTIFICATE_THUMBPRINT` signs from the Windows certificate store,
`CERTIFICATE_PASSWORD` signs with a `.pfx`, and neither builds unsigned. See
`.env.sample`.

The release workflow runs it too, through `tauri-action`'s `tauriScript`, so a
CI build signs the same way a local one does.

## `sign.cmd`
Called by `tauri-build.mjs` once per artifact when signing with a `.pfx`. Not
meant to be run by hand.

## `region_format.py`
One-off formatter for the `.json` files in `src/data/` and `src/data/lgu/`, taken
from [bettergov](https://github.com/bettergovph/bettergov). Not part of the
build.
