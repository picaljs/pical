import { Middleware } from "koa";
import qs from "qs";

declare module "koa" {
  interface ContextDelegatedRequest {
    query: Record<string, unknown>;
  }
}

export const qsMiddleware: Middleware = async (ctx, next) => {
  Object.defineProperties(ctx.request, {
    query: {
      get() {
        const str = this.querystring;
        if (!str) {
          return {};
        }
        return qs.parse(str, {
          depth: 1,
          strictNullHandling: true,
          // https://github.com/ljharb/qs/issues/91
          decoder(str, decoder, charset) {
            const strWithoutPlus = str.replace(/\+/gu, " ");
            if (charset === "iso-8859-1") {
              return strWithoutPlus.replace(/%[0-9a-f]{2}/giu, unescape);
            }

            if (/^\d+|\d*\.\d+$/u.test(str)) {
              return parseFloat(str);
            }

            const keywords = {
              true: true,
              false: false,
              null: null,
              undefined
            };
            if (str in keywords) {
              return keywords[str];
            }
            try {
              return decodeURIComponent(strWithoutPlus);
            } catch (e) {
              return strWithoutPlus;
            }
          }
        });
      },
      set(obj) {
        this.querystring = qs.stringify(obj);
      }
    }
  });
  await next();
};
