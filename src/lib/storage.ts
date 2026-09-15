import fs from "fs";
import path from "path";
import crypto from "crypto";
import { put, del, head } from "@vercel/blob";

export interface UploadInput {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
}

export interface UploadResult {
  storageFilename: string;
  size: number;
}

export interface DownloadResult {
  stream: NodeJS.ReadableStream | Buffer;
  size: number;
  mimeType: string;
  filename: string;
}

export interface IStorageService {
  upload(input: UploadInput): Promise<UploadResult>;
  download(storageFilename: string, originalFilename?: string): Promise<DownloadResult>;
  delete(storageFilename: string): Promise<boolean>;
  exists(storageFilename: string): Promise<boolean>;
}

/**
 * Vercel Blob Storage implementation for Production / Cloud deployments.
 */
export class VercelBlobStorageService implements IStorageService {
  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.BLOB_READ_WRITE_TOKEN || "";
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const ext = path.extname(input.originalFilename).toLowerCase();
    const randomId = crypto.randomBytes(16).toString("hex");
    const blobPath = `closings/${Date.now()}-${randomId}${ext}`;

    const blob = await put(blobPath, input.buffer, {
      access: "public",
      contentType: input.mimeType,
      token: this.token || process.env.BLOB_READ_WRITE_TOKEN,
    });

    return {
      storageFilename: blob.url,
      size: input.buffer.length,
    };
  }

  async download(storageFilename: string, originalFilename?: string): Promise<DownloadResult> {
    if (storageFilename.startsWith("http://") || storageFilename.startsWith("https://")) {
      const res = await fetch(storageFilename);
      if (!res.ok) {
        throw new Error(`Gagal mengambil file dari Blob Storage: ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = res.headers.get("content-type") || "application/octet-stream";

      let cleanName = originalFilename;
      if (!cleanName) {
        try {
          const urlObj = new URL(storageFilename);
          cleanName = path.basename(urlObj.pathname);
        } catch {
          cleanName = "downloaded-file";
        }
      }

      return {
        stream: buffer,
        size: buffer.length,
        mimeType,
        filename: cleanName,
      };
    }

    const local = new LocalStorageService();
    return local.download(storageFilename, originalFilename);
  }

  async delete(storageFilename: string): Promise<boolean> {
    if (storageFilename.startsWith("http://") || storageFilename.startsWith("https://")) {
      try {
        await del(storageFilename, {
          token: this.token || process.env.BLOB_READ_WRITE_TOKEN,
        });
        return true;
      } catch {
        return false;
      }
    }
    const local = new LocalStorageService();
    return local.delete(storageFilename);
  }

  async exists(storageFilename: string): Promise<boolean> {
    if (storageFilename.startsWith("http://") || storageFilename.startsWith("https://")) {
      try {
        const details = await head(storageFilename, {
          token: this.token || process.env.BLOB_READ_WRITE_TOKEN,
        });
        return !!details;
      } catch {
        return false;
      }
    }
    const local = new LocalStorageService();
    return local.exists(storageFilename);
  }
}

/**
 * Local filesystem storage implementation (fallback for offline local dev without blob token).
 */
export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor(customPath?: string) {
    if (customPath && path.isAbsolute(customPath)) {
      this.baseDir = customPath;
    } else {
      this.baseDir = path.join(process.cwd(), "private_storage", "uploads");
    }

    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch {
      this.baseDir = path.join("/tmp", "private_storage", "uploads");
      try {
        if (!fs.existsSync(this.baseDir)) {
          fs.mkdirSync(this.baseDir, { recursive: true });
        }
      } catch {}
    }
  }

  private resolveSafePath(filename: string): string {
    const cleanFilename = path.basename(filename);
    const resolved = path.resolve(this.baseDir, cleanFilename);
    if (!resolved.startsWith(path.resolve(this.baseDir))) {
      throw new Error("Invalid storage path traversal attempt");
    }
    return resolved;
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const ext = path.extname(input.originalFilename).toLowerCase();
    const randomId = crypto.randomBytes(24).toString("hex");
    const storageFilename = `${Date.now()}-${randomId}${ext}`;
    let fullPath = this.resolveSafePath(storageFilename);

    try {
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      await fs.promises.writeFile(fullPath, input.buffer);
    } catch (err: any) {
      if (err.code === "EROFS" || !this.baseDir.startsWith("/tmp")) {
        this.baseDir = path.join("/tmp", "private_storage", "uploads");
        if (!fs.existsSync(this.baseDir)) {
          fs.mkdirSync(this.baseDir, { recursive: true });
        }
        fullPath = this.resolveSafePath(storageFilename);
        await fs.promises.writeFile(fullPath, input.buffer);
      } else {
        throw err;
      }
    }

    const stat = await fs.promises.stat(fullPath);

    return {
      storageFilename,
      size: stat.size,
    };
  }

  async download(storageFilename: string, originalFilename?: string): Promise<DownloadResult> {
    const fullPath = this.resolveSafePath(storageFilename);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${storageFilename}`);
    }

    const stat = await fs.promises.stat(fullPath);
    const buffer = await fs.promises.readFile(fullPath);

    const ext = path.extname(storageFilename).toLowerCase();
    let mimeType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else if (ext === ".png") mimeType = "image/png";
    else if (ext === ".pdf") mimeType = "application/pdf";
    else if (ext === ".xlsx") mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === ".xls") mimeType = "application/vnd.ms-excel";

    return {
      stream: buffer,
      size: stat.size,
      mimeType,
      filename: originalFilename || storageFilename,
    };
  }

  async delete(storageFilename: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(storageFilename);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async exists(storageFilename: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(storageFilename);
    return fs.existsSync(fullPath);
  }
}

/**
 * Unified storage delegator: Uses Vercel Blob when token is configured,
 * otherwise falls back gracefully to LocalStorage.
 */
export class UnifiedStorageService implements IStorageService {
  private getActiveService(): IStorageService {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      return new VercelBlobStorageService(process.env.BLOB_READ_WRITE_TOKEN);
    }
    return new LocalStorageService();
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    return this.getActiveService().upload(input);
  }

  async download(storageFilename: string, originalFilename?: string): Promise<DownloadResult> {
    if (storageFilename.startsWith("http://") || storageFilename.startsWith("https://")) {
      return new VercelBlobStorageService().download(storageFilename, originalFilename);
    }
    return new LocalStorageService().download(storageFilename, originalFilename);
  }

  async delete(storageFilename: string): Promise<boolean> {
    if (storageFilename.startsWith("http://") || storageFilename.startsWith("https://")) {
      return new VercelBlobStorageService().delete(storageFilename);
    }
    return new LocalStorageService().delete(storageFilename);
  }

  async exists(storageFilename: string): Promise<boolean> {
    if (storageFilename.startsWith("http://") || storageFilename.startsWith("https://")) {
      return new VercelBlobStorageService().exists(storageFilename);
    }
    return new LocalStorageService().exists(storageFilename);
  }
}

export const storageService: IStorageService = new UnifiedStorageService();
