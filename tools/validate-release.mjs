import { readFile } from "node:fs/promises";

const [tag = `v${process.env.npm_package_version ?? ""}`, repository = "Yax74/wraeclast-npc-gen"] = process.argv.slice(2);
const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url), "utf8"));
const expectedTag = `v${manifest.version}`;

const failures = [];

if (tag !== expectedTag) {
  failures.push(`Release tag ${tag || "<missing>"} does not match manifest version ${manifest.version}.`);
}

const expectedUrl = `https://github.com/${repository}`;
const expectedManifest = `${expectedUrl}/releases/latest/download/module.json`;
const expectedDownload = `${expectedUrl}/releases/download/${expectedTag}/wraeclast-npc-gen.zip`;

for (const [field, expected] of [
  ["url", expectedUrl],
  ["manifest", expectedManifest],
  ["download", expectedDownload]
]) {
  if (manifest[field] !== expected) {
    failures.push(`module.json ${field} must be ${expected}; found ${manifest[field] ?? "<missing>"}.`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Release metadata is valid for ${repository} ${tag}.`);
