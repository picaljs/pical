import { BucketItemStat, Client, ClientOptions } from "minio";
import { Readable } from "stream";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";

export interface Storage {
  load(key: string): Promise<Readable>;
  exist(key: string): Promise<boolean>;
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

  async metadata(key: string): Promise<BucketItemStat> {
    return this.client.statObject(this.bucket, key);
  }
}

export class LocalStorage implements Storage {
  protected baseDir: string;

  constructor(baseDir: string) {
    const stat = fs.lstatSync(baseDir);
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
    return fs.createReadStream(filePath);
  }

  async exist(key: string): Promise<boolean> {
    const filePath = this.resolveKey(key);
    try {
      await fsp.lstat(filePath);
      return true;
    } catch (e) {
      return false;
    }
  }
}
