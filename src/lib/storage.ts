import fs from "fs";
import path from "path";
import crypto from "crypto";

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

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor(customPath?: string) {
    if (customPath && path.isAbsolute(customPath)) {
      this.baseDir = customPath;
    } else {
      this.baseDir = path.join(process.cwd(), "private_storage", "uploads");
    }

    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
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
    const fullPath = this.resolveSafePath(storageFilename);

    await fs.promises.writeFile(fullPath, input.buffer);
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

export const storageService = new LocalStorageService();
