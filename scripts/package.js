// Builds dist/bulk-entry-for-salesforce-v<version>.zip for people to install
// with "Load unpacked". The zip holds one folder, bulk-entry-for-salesforce,
// which is the folder they choose in Chrome.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const { version } = JSON.parse(readFileSync(join(root, "extension/manifest.json"), "utf8"));
const folder = "bulk-entry-for-salesforce";
const out = join(root, "dist", `${folder}-v${version}.zip`);

const staging = mkdtempSync(join(tmpdir(), "bulk-entry-"));
try {
  cpSync(join(root, "extension"), join(staging, folder), {
    recursive: true,
    filter: (src) => !src.split("/").pop().startsWith("."),
  });
  cpSync(join(root, "LICENSE"), join(staging, folder, "LICENSE"));

  mkdirSync(join(root, "dist"), { recursive: true });
  rmSync(out, { force: true });
  execFileSync("zip", ["-r", "-X", "-q", out, folder], { cwd: staging });
} finally {
  rmSync(staging, { recursive: true, force: true });
}

console.log(`${out} (${Math.round(statSync(out).size / 1024)} KB)`);
