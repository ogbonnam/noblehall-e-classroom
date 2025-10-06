// lib/file.ts
import fs from 'fs';
import path from 'path';

export function ensureUploadDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function moveFile(tempPath: string, filename: string, uploadDir: string) {
  ensureUploadDir(uploadDir);
  const target = path.join(uploadDir, filename);
  fs.renameSync(tempPath, target);
  return target;
}
