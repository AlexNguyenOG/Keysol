#!/usr/bin/env node
/**
 * Downloads official brand YouTube commercials into public/keyboards/showcases/.
 * Requires: python3 -m yt_dlp (pip install yt-dlp)
 *
 * Clip start/end is applied at playback time in KeyboardShowcaseMedia — full videos
 * are stored once per YouTube source and copied per keyboard entry.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const showcasesDir = path.join(root, "public", "keyboards", "showcases");
const cacheDir = path.join(showcasesDir, ".cache");
const registryPath = path.join(root, "src", "data", "keyboard-showcases.ts");

mkdirSync(showcasesDir, { recursive: true });
mkdirSync(cacheDir, { recursive: true });

function parseRegistry(filePath) {
  const source = readFileSync(filePath, "utf8");
  const entries = [];
  const blockRe =
    /\{\s*keyboardId:\s*"([^"]+)"[\s\S]*?youtubeId:\s*"([^"]+)"[\s\S]*?clipStartSec:\s*(\d+)[\s\S]*?clipEndSec:\s*(\d+)[\s\S]*?credit:\s*"([^"]+)"/g;

  for (const match of source.matchAll(blockRe)) {
    entries.push({
      keyboardId: match[1],
      youtubeId: match[2],
      clipStartSec: Number(match[3]),
      clipEndSec: Number(match[4]),
      credit: match[5],
    });
  }

  return entries;
}

function downloadYoutube(youtubeId, destPath) {
  if (existsSync(destPath)) {
    return true;
  }

  const url = `https://www.youtube.com/watch?v=${youtubeId}`;
  const result = spawnSync(
    "python3",
    [
      "-m",
      "yt_dlp",
      "--extractor-args",
      "youtube:player_client=android",
      "-f",
      "best[height<=480][ext=mp4]/best[height<=480]/best",
      "--no-playlist",
      "-o",
      destPath,
      url,
    ],
    { stdio: "inherit" },
  );

  return result.status === 0 && existsSync(destPath);
}

const entries = parseRegistry(registryPath);
const uniqueYoutubeIds = [...new Set(entries.map((entry) => entry.youtubeId))];

console.log(`Fetching ${uniqueYoutubeIds.length} official source videos…`);

const downloaded = new Map();
for (const youtubeId of uniqueYoutubeIds) {
  const cachePath = path.join(cacheDir, `${youtubeId}.mp4`);
  const ok = downloadYoutube(youtubeId, cachePath);
  if (ok) {
    downloaded.set(youtubeId, cachePath);
    console.log(`✓ ${youtubeId}`);
  } else {
    console.warn(`✗ failed: ${youtubeId}`);
  }
}

let copied = 0;
for (const entry of entries) {
  const cachePath = downloaded.get(entry.youtubeId);
  if (!cachePath) {
    continue;
  }

  const dest = path.join(showcasesDir, `${entry.keyboardId}.mp4`);
  copyFileSync(cachePath, dest);
  copied += 1;
}

console.log(`\nCopied ${copied}/${entries.length} showcase clips to public/keyboards/showcases/`);
