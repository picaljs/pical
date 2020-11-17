import { DefaultContext, DefaultState } from "koa";
import Router from "@koa/router";
import { PassThrough } from "stream";
import mime from "mime-types";
import crypto from "crypto";
import base64 from "js-base64";
import { parseInteger } from "./func";

const {
  PICAL_KEY: key = "default",
  PICAL_SALT: salt = "default",
  PICAL_CACHE: cacheTime
} = process.env;

const maxAge = parseInteger(cacheTime) || 604800;

export const transformRouter = new Router<DefaultState, DefaultContext>();

const parsePath = (path: string): [string, string] | undefined => {
  const match = /^(?<path>.+)@(?<format>.+)$/gu.exec(path);
  if (!match || !match.groups) {
    return undefined;
  }
  return [match.groups.path, match.groups.format.toLowerCase()];
};

const validFormats = [
  "heic",
  "heif",
  "jpeg",
  "jpg",
  "png",
  "raw",
  "tiff",
  "webp",
  "gif"
];

const generateSignature = (url: string): string => {
  const hamc = crypto.createHmac("sha256", key);
  hamc.update(salt);
  hamc.update(url);
  return hamc.digest().slice(0, 32).toString("utf-8");
};

transformRouter.get("image", "/:path+", async (ctx, next) => {
  const { path = "", signature } = ctx.params;

  if (signature) {
    const url = transformRouter.url("image", path, { query: ctx.querystring });
    const digest = generateSignature(url);
    const expected = base64.encode(digest, true);
    if (signature !== expected) {
      ctx.throw(403);
    }
  }

  const result = parsePath(path);
  if (!result) {
    ctx.throw("Invalid Path", 400);
    return;
  }
  const [file, format] = result;
  if (!validFormats.includes(format)) {
    ctx.throw("Invalid Format", 400);
  }

  if (!(await ctx.storage.exist(file))) {
    ctx.throw(404);
  }

  const { etag, lastModified } = await ctx.storage.metadata(file);
  ctx.etag = `W/"${etag}"`;
  ctx.lastModified = lastModified;
  const contentType = mime.lookup(`.${format}`) || "application/octet-stream";
  ctx.set("Content-Type", contentType);
  ctx.set("Cache-Control", `public, max-age=${maxAge}`);
  ctx.status = 200;

  if (ctx.fresh) {
    ctx.status = 304;
    await next();
    return;
  }

  ctx.body = (await ctx.storage.load(file))
    .pipe(ctx.transformImage({ format, query: ctx.query }))
    .pipe(new PassThrough());
  await next();
});
