import { DefaultContext, DefaultState, ParameterizedContext } from "koa";
import Router from "@koa/router";
import mime from "mime-types";
import { generateSignature } from "@pical/signature";
import fileType from "file-type";

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
  "gif",
  "original"
];

const transformOriginal = async (
  ctx: ParameterizedContext<DefaultState, DefaultContext>,
  file: string,
  contentType?: string
): Promise<void> => {
  let resContentType: string;
  if (!contentType) {
    const result = await fileType.fromStream(await ctx.storage.load(file));
    resContentType = result?.mime || "application/octet-stream";
  } else {
    resContentType = contentType;
  }
  ctx.set("Content-Type", resContentType);
  ctx.body = await ctx.storage.load(file);
};

const transformImage = async (
  ctx: ParameterizedContext<DefaultState, DefaultContext>,
  format: string,
  file: string
): Promise<void> => {
  const contentType = mime.lookup(`.${format}`) || "application/octet-stream";
  ctx.set("Content-Type", contentType);
  const original = await ctx.storage.load(file);
  ctx.body = original.pipe(ctx.transformImage({ format, query: ctx.query }));
};

transformRouter.get("image", "/:path+", async (ctx, next) => {
  const { path = "", signature } = ctx.params;

  if (signature) {
    const url = transformRouter.url("image", path, { query: ctx.querystring });
    const expected = generateSignature(url, key, salt);
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

  const { etag, lastModified, contentType } = await ctx.storage.metadata(file);
  ctx.etag = `W/"${etag}"`;
  ctx.lastModified = lastModified;
  ctx.set("Cache-Control", `public, max-age=${maxAge}`);
  ctx.status = 200;

  if (ctx.fresh) {
    ctx.status = 304;
    await next();
    return;
  }

  if (format === "original") {
    await transformOriginal(ctx, file, contentType);
  } else {
    await transformImage(ctx, format, file);
  }

  await next();
});
