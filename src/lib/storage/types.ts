import { Readable } from "stream";

export interface UploadOptions {
  key: string;
  buffer: Buffer;
  mimeType: string;
}

export interface DownloadResult {
  stream: NodeJS.ReadableStream | Buffer;
  size: number;
  mimeType: string;
}

export interface IStorageService {
  upload(options: UploadOptions): Promise<{ storageKey: string; size: number }>;
  download(key: string): Promise<DownloadResult>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
}
