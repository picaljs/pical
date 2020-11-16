import { Middleware } from "koa";
import { parseBoolean, parseInteger } from "./func";

import { LocalStorage, S3Storage, Storage } from "./storage";

declare module "koa" {
  interface DefaultContext {
    storage: Storage;
  }
}

const {
  PICAL_LOCAL_BASE_DIR: baseDir = ".",
  PICAL_S3_END_POINT: endPoint,
  PICAL_S3_BUCKET: bucket,
  PICAL_S3_ACCESS_KEY: accessKey,
  PICAL_S3_SECRET_KEY: secretKey,
  PICAL_S3_USE_SSL: useSSL,
  PICAL_S3_PORT: port,
  PICAL_S3_REGION: region,
  PICAL_S3_SESSION_TOKEN: sessionToken,
  PICAL_S3_PART_SIZE: partSize
} = process.env;

const storage: Storage =
  endPoint && bucket && accessKey && secretKey
    ? new S3Storage(bucket, {
        endPoint,
        accessKey,
        secretKey,
        useSSL: parseBoolean(useSSL),
        port: parseInteger(port),
        region,
        sessionToken,
        partSize: parseInteger(partSize)
      })
    : new LocalStorage(baseDir);

export const storageMiddleware: Middleware = async (ctx, next) => {
  ctx.storage = storage;
  await next();
};
