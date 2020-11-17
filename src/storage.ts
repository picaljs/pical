import { Client, ClientOptions } from "minio";
import { Readable } from "stream";
import { createReadStream, lstatSync } from "fs";
import fs from "fs/promises";
import path from "path";

export interface Metadata {
  etag: string;
  lastModified: Date;
}

export interface Storage {
  load(key: string): Promise<Readable>;
  exist(key: string): Promise<boolean>;
  metadata(key: string): Promise<Metadata>;
}

export class S3Storage implements Storage {
  protected client: Client;
  protected bucket: string;

  constructor(bucket: string, option: ClientOptions) {
    this.client = new Client(option);
    this.bucket = bucket;
  }

  async load(key: string): Promise<Readable> {
    return this.client.getObject(this.bucket, key);
  }

  async exist(key: string): Promise<boolean> {
    try {
      await this.metadata(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  async metadata(key: string): Promise<Metadata> {
    return this.client.statObject(this.bucket, key);
  }
}

export class LocalStorage implements Storage {
  protected baseDir: string;

  constructor(baseDir: string) {
    const stat = lstatSync(baseDir);
    this.baseDir = baseDir;
    if (!stat.isDirectory()) {
      throw new Error(`${baseDir} is not a directory.`);
    }
  }

  normalizeKey(key: string): string {
    const normalized = path.normalize(key);
    return normalized.startsWith("/") ? normalized.substr(1) : normalized;
  }

  resolveKey(key: string): string {
    return path.join(this.baseDir, this.normalizeKey(key));
  }

  async load(key: string): Promise<Readable> {
    const filePath = this.resolveKey(key);
    return createReadStream(filePath);
  }

  async exist(key: string): Promise<boolean> {
    const filePath = this.resolveKey(key);
    try {
      await fs.lstat(filePath);
      return true;
    } catch (e) {
      return false;
    }
  }

  async metadata(key: string): Promise<Metadata> {
    const filePath = this.resolveKey(key);
    const stat = await fs.lstat(filePath);
    const mtime = stat.mtime.getTime().toString(16);
    const size = stat.size.toString(16);
    return {
      etag: `${size}-${mtime}`,
      lastModified: stat.mtime
    };
  }
}
