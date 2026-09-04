# Scripts

## `tauri-build.mjs`
Run through `pnpm build`. Wraps `tauri build` and decides how to sign from the
environment: `CERTIFICATE_THUMBPRINT` signs from the Windows certificate store,
`CERTIFICATE_PASSWORD` signs with a `.pfx`, and neither builds unsigned. See
`.env.sample`.

`TAURI_SIGNING_PRIVATE_KEY` is a separate decision it makes the same way: with a
key in the environment it turns on `createUpdaterArtifacts` so the build emits
`latest.json` and the `.sig` files an installed copy needs, and without one it
leaves the setting off. That is why the setting is not in
`src-tauri/tauri.conf.json`, where it would make every keyless build fail.

The release workflow runs it too, through `tauri-action`'s `tauriScript`, so a
CI build signs the same way a local one does.

## `sign.cmd`
Called by `tauri-build.mjs` once per artifact when signing with a `.pfx`. Not
meant to be run by hand.

## `region_format.py`
One-off formatter for the `.json` files in `src/data/` and `src/data/lgu/`, taken
from [bettergov](https://github.com/bettergovph/bettergov). Not part of the
build.
