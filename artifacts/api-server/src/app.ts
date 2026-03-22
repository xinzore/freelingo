import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { randomUUID } from "crypto";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const NETWORK_ERROR_CODES = new Set(["ENETUNREACH", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"]);

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;

  const code = "code" in error ? error.code : undefined;
  if (typeof code === "string") return code;

  if ("cause" in error) {
    return getErrorCode(error.cause);
  }

  return undefined;
}

function getApiErrorResponse(error: unknown): { status: number; message: string } {
  const errorCode = getErrorCode(error);

  if (errorCode && NETWORK_ERROR_CODES.has(errorCode)) {
    return {
      status: 503,
      message:
        "Veritabanina baglanilamadi. Supabase IPv4 pooler DATABASE_URL kullanin; direct db host IPv6 gerektiriyor olabilir.",
    };
  }

  return {
    status: 500,
    message: "Sunucu hatasi. Tekrar deneyin.",
  };
}

app.use((req, res, next) => {
  const requestId = randomUUID();
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info(
      {
        req: {
          id: requestId,
          method: req.method,
          url: req.originalUrl.split("?")[0],
        },
        res: {
          statusCode: res.statusCode,
        },
        responseTime: Math.round(durationMs),
      },
      "request completed",
    );
  });

  next();
});
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith("/api")) {
    next(error);
    return;
  }

  logger.error({ err: error, url: req.originalUrl }, "Unhandled API error");

  const { status, message } = getApiErrorResponse(error);
  res.status(status).json({ error: message });
});

export default app;
