import { Router, type IRouter, type Request, type Response } from "express";
import {
  clearSession,
  getSessionId,
} from "../lib/auth";

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const forwardedProtoHeader = req.headers["x-forwarded-proto"];
  const forwardedProto = Array.isArray(forwardedProtoHeader)
    ? forwardedProtoHeader[0]
    : forwardedProtoHeader?.split(",")[0]?.trim();
  const hostHeader = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const proto = forwardedProto || req.protocol || "http";
  return `${proto}://${host}`;
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json({
    user: req.isAuthenticated() ? req.user : null,
  });
});

router.get("/logout", async (req: Request, res: Response) => {
  const origin = getOrigin(req);
  const returnTo = getSafeReturnTo(req.query.returnTo);
  const postLogoutRedirectUrl = new URL(returnTo, origin).toString();

  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect(postLogoutRedirectUrl);
});

export default router;
