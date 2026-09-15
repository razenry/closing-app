import fs from "fs";
import path from "path";
import { IStorageService, UploadOptions, DownloadResult } from "./types";

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir ?? path.join(process.cwd(), "private_storage", "uploads");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolveSafePath(key: string): string {
    // Sanitize key and ensure it stays inside baseDir
    const cleanKey = key.replace(/^(\.\.[\/\\])+/, "").replace(/^[\\\/]+/, "");
    const resolved = path.resolve(this.baseDir, cleanKey);
    if (!resolved.startsWith(path.resolve(this.baseDir))) {
      throw new Error("Invalid storage path traversal attempt");
    }
    return resolved;
  }

  async upload(options: UploadOptions): Promise<{ storageKey: string; size: number }> {
    const fullPath = this.resolveSafePath(options.key);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, options.buffer);
    const stats = await fs.promises.stat(fullPath);
    return {
      storageKey: options.key,
      size: stats.size,
    };
  }

  async download(key: string): Promise<DownloadResult> {
    const fullPath = this.resolveSafePath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found in storage: ${key}`);
    }

    const stats = await fs.promises.stat(fullPath);
    const buffer = await fs.promises.readFile(fullPath);
    
    // Determine fallback mimeType from extension if needed
    const ext = path.extname(key).toLowerCase();
    let mimeType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else if (ext === ".png") mimeType = "image/png";
    else if (ext === ".pdf") mimeType = "application/pdf";
    else if (ext === ".xlsx") mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === ".xls") mimeType = "application/vnd.ms-excel";

    return {
      stream: buffer,
      size: stats.size,
      mimeType,
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(key);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(key);
    return fs.existsSync(fullPath);
  }
}

export const storageService = new LocalStorageService();
