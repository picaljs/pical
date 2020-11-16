import Koa, { DefaultContext, DefaultState } from "koa";
import pino from "koa-pino-logger";
import Router from "@koa/router";

import { qsMiddleware } from "./qs";
import { imageMiddleware } from "./image";
import { transformRouter } from "./transform";
import { storageMiddleware } from "./file";
import { parseBoolean, parseInteger } from "./func";

const { NODE_ENV, PICAL_UNSAFE_PLAIN, PICAL_PORT } = process.env;
const isProduction = NODE_ENV === "production";

const app = new Koa();
const router = new Router<DefaultState, DefaultContext>();

if (!isProduction || parseBoolean(PICAL_UNSAFE_PLAIN)) {
  router.use("/p", transformRouter.routes(), transformRouter.allowedMethods());
}

router.use(
  "/s/:signature",
  transformRouter.routes(),
  transformRouter.allowedMethods()
);

export const main = async (): Promise<void> => {
  app.use(pino({ autoLogging: false }));
  app.use(qsMiddleware);
  app.use(storageMiddleware);
  app.use(imageMiddleware);
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.listen(parseInteger(PICAL_PORT) || 8080);
};
