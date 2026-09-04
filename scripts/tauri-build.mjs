// Wraps `tauri build` so one command covers all three signing situations:
//
//   CERTIFICATE_THUMBPRINT  certificate already in the Windows certificate store
//   CERTIFICATE_PASSWORD    certificate as a .pfx file on disk
//   neither                 unsigned installer
//
// and so the updater artifacts are produced only when there is an updater key to
// sign them with. That key is a different thing from the certificate above: it
// signs the manifest the running app checks, not the installer Windows checks.
//
// The mode is decided here rather than in tauri.conf.json because that file is
// committed: a thumbprint or a signing command baked into it would make every
// clone of the repository try to sign, and fail.
//
// Run through `pnpm build`, which loads `.env` first.

import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const SIGN_SCRIPT = path.join(ROOT, "scripts", "sign.cmd");
const TAURI_CONF = path.join(ROOT, "src-tauri", "tauri.conf.json");
const DEFAULT_CERTIFICATE = path.join("cert", "cendrive.pfx");

/** Paths are quoted in output, so make them readable while still unambiguous. */
function rel(target) {
  return path.relative(ROOT, target).replaceAll("\\", "/");
}

function fail(message) {
  console.error(`build: ${message}`);
  process.exit(1);
}

/** Trimmed value, or "" when the variable is unset or blank. */
function env(name) {
  return (process.env[name] ?? "").trim();
}

/** Newest first, so the highest installed SDK wins. */
function byVersionDescending(a, b) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (right[index] ?? 0) - (left[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * `signtool.exe` ships with the Windows SDK and is not on PATH, so it has to be
 * found. Tauri does its own lookup for the built-in signing path; this one is
 * only needed for the custom sign command.
 */
function findSigntool() {
  const architectures = process.arch === "arm64" ? ["arm64", "x64", "x86"] : ["x64", "x86"];
  const roots = [process.env["ProgramFiles(x86)"], process.env.ProgramFiles]
    .filter(Boolean)
    .map((base) => path.join(base, "Windows Kits", "10", "bin"));

  for (const root of roots) {
    if (!existsSync(root)) continue;
    const versions = readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^\d+(\.\d+)*$/.test(entry.name))
      .map((entry) => entry.name)
      .sort(byVersionDescending);

    // "" covers the older layout, where the architecture sits directly in bin/.
    for (const version of [...versions, ""]) {
      for (const architecture of architectures) {
        const candidate = path.join(root, version, architecture, "signtool.exe");
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  return null;
}

/** One source of truth for the timestamp server: the committed Tauri config. */
function timestampUrl() {
  try {
    const conf = JSON.parse(readFileSync(TAURI_CONF, "utf8"));
    return conf.bundle?.windows?.timestampUrl ?? "";
  } catch {
    return "";
  }
}

/**
 * Returns the config to merge over tauri.conf.json plus any extra environment
 * the sign command needs.
 */
function resolveSigning() {
  // Thumbprints are usually copied out of certmgr, which shows them spaced.
  const thumbprint = env("CERTIFICATE_THUMBPRINT").replaceAll(/[\s:]/g, "");
  const password = env("CERTIFICATE_PASSWORD");

  if (thumbprint) {
    if (!/^[0-9a-fA-F]{40}$/.test(thumbprint)) {
      fail(
        "CERTIFICATE_THUMBPRINT must be the certificate's 40-character SHA1 hash. " +
          "Copy it from certmgr, or unset it to build unsigned.",
      );
    }
    return {
      description: `signing with the certificate store entry ending ${thumbprint.slice(-8)}`,
      config: { bundle: { windows: { certificateThumbprint: thumbprint } } },
      extraEnv: {},
    };
  }

  if (password) {
    if (process.platform !== "win32") {
      fail("CERTIFICATE_PASSWORD signing uses signtool.exe, which only runs on Windows.");
    }
    const certificate = path.resolve(ROOT, env("CERTIFICATE_PATH") || DEFAULT_CERTIFICATE);
    if (!existsSync(certificate)) {
      fail(
        `CERTIFICATE_PASSWORD is set but there is no certificate at "${rel(certificate)}". ` +
          "Point CERTIFICATE_PATH at your .pfx, or unset the password to build unsigned.",
      );
    }
    const signtool = env("SIGNTOOL_PATH") || findSigntool();
    if (!signtool) {
      fail(
        "signtool.exe was not found. Install the Windows SDK signing tools, " +
          "or set SIGNTOOL_PATH to its full path.",
      );
    }
    return {
      description: `signing with "${rel(certificate)}"`,
      // A wrapper script, not signtool directly: Tauri echoes the sign command it
      // runs, and `signtool /p <password>` in there would put the password in the
      // build log and in every process listing on the machine. The wrapper reads
      // it from its inherited environment instead.
      config: {
        bundle: {
          windows: { signCommand: { cmd: "cmd", args: ["/c", SIGN_SCRIPT, "%1"] } },
        },
      },
      extraEnv: {
        CERTIFICATE_PATH: certificate,
        SIGNTOOL_PATH: signtool,
        TIMESTAMP_URL: env("TIMESTAMP_URL") || timestampUrl(),
      },
    };
  }

  return { description: "building unsigned", config: {}, extraEnv: {} };
}

/**
 * The updater key in `signkey/`, not the certificate above: this one signs the
 * manifest an installed copy checks. `bundle.createUpdaterArtifacts` is on in
 * tauri.conf.json, so every build needs it, and the bundler only says so once
 * the Rust build has finished — a long walk for a missing variable. Check up
 * front, and pass the setting along so the command says what the config says.
 */
function resolveUpdater() {
  if (!env("TAURI_SIGNING_PRIVATE_KEY")) {
    fail(
      "TAURI_SIGNING_PRIVATE_KEY is not set and tauri.conf.json asks for " +
        "updater artifacts. Set it in .env — see .env.sample — or turn off " +
        "bundle.createUpdaterArtifacts to build without them.",
    );
  }
  return {
    description: "producing signed updater artifacts",
    config: { bundle: { createUpdaterArtifacts: true } },
  };
}

/** Both fragments above write into `bundle`, so they are merged, not spread. */
function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    target[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? merge(target[key] ?? {}, value)
        : value;
  }
  return target;
}

const signing = resolveSigning();
const updater = resolveUpdater();
const config = merge(merge({}, signing.config), updater.config);

// The release workflow runs this through tauri-action, which appends its own
// `build` to the command it is given, so the subcommand can arrive from either
// side. Keep exactly one.
const passthrough = process.argv.slice(2);
if (passthrough[0] === "build") passthrough.shift();

const args = ["build", ...passthrough];
if (Object.keys(config).length > 0) {
  args.push("--config", JSON.stringify(config));
}

console.log(`build: ${signing.description}.`);
if (Object.keys(signing.config).length === 0) {
  console.log(
    "build: set CERTIFICATE_THUMBPRINT or CERTIFICATE_PASSWORD in .env to sign the installer.",
  );
}
console.log(`build: ${updater.description}.`);

// The CLI's own bin script, run through this Node: no shell, so nothing can
// mangle the JSON argument, and no dependency on `pnpm exec` being on PATH.
let cli;
try {
  cli = createRequire(import.meta.url).resolve("@tauri-apps/cli/tauri.js");
} catch {
  fail("@tauri-apps/cli is not installed. Run `pnpm install` first.");
}

const child = spawn(process.execPath, [cli, ...args], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, ...signing.extraEnv },
});

child.on("error", (error) => fail(`could not start the Tauri CLI: ${error.message}`));
child.on("exit", (code, signal) => {
  // A signalled child has no exit code; report it as a failure rather than as 0.
  process.exit(signal ? 1 : (code ?? 1));
});
