import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Router, type IRouter, type Request, type Response } from "express";
import { Resend } from "resend";
import { db, usersTable, emailAuthTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createSession, SESSION_COOKIE, SESSION_TTL } from "../lib/auth";

const router: IRouter = Router();

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_dev");

const FROM_EMAIL = "FreeLingo <onboarding@resend.dev>";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

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

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: "E-posta, şifre ve isim zorunludur." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Şifre en az 6 karakter olmalıdır." });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Geçerli bir e-posta adresi girin." });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing.length > 0) {
    const emailAuth = await db.select().from(emailAuthTable).where(eq(emailAuthTable.userId, existing[0].id));
    if (emailAuth.length > 0) {
      res.status(409).json({ error: "Bu e-posta adresi zaten kayıtlı." });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = generateToken();
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const nameParts = name.trim().split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || null;

  let userId: string;

  if (existing.length > 0) {
    userId = existing[0].id;
    await db.update(usersTable)
      .set({ firstName, lastName, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
  } else {
    const [newUser] = await db.insert(usersTable).values({
      email: email.toLowerCase(),
      firstName,
      lastName,
    }).returning();
    userId = newUser.id;
  }

  const origin = getOrigin(req);
  const verifyUrl = `${origin}/api/auth/verify-email?token=${verificationToken}`;

  // In development: auto-verify to avoid email dependency during testing
  const autoVerify = !IS_PRODUCTION;

  await db.insert(emailAuthTable).values({
    userId,
    passwordHash,
    isVerified: autoVerify,
    verificationToken: autoVerify ? null : verificationToken,
    verificationTokenExpires: autoVerify ? null : verificationTokenExpires,
  });

  if (autoVerify) {
    // Dev mode: create session immediately, no email needed
    console.log(`[DEV] Auto-verified user: ${email}`);
    const sessionData = {
      user: {
        id: userId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        profileImageUrl: null,
      },
    };
    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.json({ success: true, message: "Kayıt başarılı! Hoş geldin!" });
    return;
  }

  // Production: send verification email
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "FreeLingo - E-posta Adresini Doğrula",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #58CC02; font-size: 32px;">🦉 FreeLingo</h1>
          </div>
          <h2 style="color: #333;">Merhaba ${firstName}!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            FreeLingo'ya hoş geldin! Hesabını aktifleştirmek için aşağıdaki butona tıkla.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #58CC02; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: bold; display: inline-block;">
              E-postamı Doğrula
            </a>
          </div>
          <p style="color: #888; font-size: 14px;">
            Bu bağlantı 24 saat geçerlidir. Eğer bu hesabı sen açmadıysan bu e-postayı görmezden gelebilirsin.
          </p>
        </div>
      `,
    });
    if (result.error) {
      console.error("[Resend] Email send error:", result.error);
    }
  } catch (err) {
    console.error("[Resend] Exception sending verification email:", err);
  }

  res.json({ success: true, message: "Kayıt başarılı! Lütfen e-posta adresini doğrula." });
});

router.post("/auth/login-email", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "E-posta ve şifre zorunludur." });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (users.length === 0) {
    res.status(401).json({ error: "E-posta veya şifre hatalı." });
    return;
  }

  const user = users[0];
  const emailAuths = await db.select().from(emailAuthTable).where(eq(emailAuthTable.userId, user.id));
  if (emailAuths.length === 0) {
    res.status(401).json({ error: "Bu hesap farklı bir yöntemle kayıt olmuş." });
    return;
  }

  const emailAuth = emailAuths[0];
  const isValid = await bcrypt.compare(password, emailAuth.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: "E-posta veya şifre hatalı." });
    return;
  }

  if (!emailAuth.isVerified) {
    res.status(401).json({ error: "Lütfen önce e-posta adresini doğrula. Doğrulama e-postası gönderildi." });
    return;
  }

  const sessionData = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  res.json({ success: true, message: "Giriş başarılı!" });
});

router.get("/auth/verify-email", async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    res.redirect("/?verified=error");
    return;
  }

  const emailAuths = await db.select().from(emailAuthTable).where(eq(emailAuthTable.verificationToken, token));
  if (emailAuths.length === 0) {
    res.redirect("/?verified=invalid");
    return;
  }

  const emailAuth = emailAuths[0];
  if (emailAuth.verificationTokenExpires && emailAuth.verificationTokenExpires < new Date()) {
    res.redirect("/?verified=expired");
    return;
  }

  await db.update(emailAuthTable)
    .set({ isVerified: true, verificationToken: null, verificationTokenExpires: null })
    .where(eq(emailAuthTable.id, emailAuth.id));

  res.redirect("/?verified=success");
});

router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.json({ success: true, message: "E-posta gönderildi (eğer kayıtlıysa)." });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (users.length === 0) {
    res.json({ success: true, message: "E-posta gönderildi (eğer kayıtlıysa)." });
    return;
  }

  const user = users[0];
  const emailAuths = await db.select().from(emailAuthTable).where(eq(emailAuthTable.userId, user.id));
  if (emailAuths.length === 0) {
    res.json({ success: true, message: "E-posta gönderildi (eğer kayıtlıysa)." });
    return;
  }

  const resetToken = generateToken();
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

  await db.update(emailAuthTable)
    .set({ resetToken, resetTokenExpires })
    .where(eq(emailAuthTable.userId, user.id));

  const origin = getOrigin(req);
  const resetUrl = `${origin}/?reset-token=${resetToken}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "FreeLingo - Şifre Sıfırlama",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #58CC02; font-size: 32px;">🦉 FreeLingo</h1>
          </div>
          <h2 style="color: #333;">Şifre Sıfırlama</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Şifre sıfırlama talebinde bulundun. Aşağıdaki butona tıkla:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #58CC02; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: bold; display: inline-block;">
              Şifremi Sıfırla
            </a>
          </div>
          <p style="color: #888; font-size: 14px;">
            Bu bağlantı 1 saat geçerlidir. Eğer bu talebi sen yapmadıysan görmezden gelebilirsin.
          </p>
        </div>
      `,
    });
  } catch (err) {
    req.log?.error?.({ err }, "Failed to send reset email");
  }

  res.json({ success: true, message: "E-posta gönderildi (eğer kayıtlıysa)." });
});

router.post("/auth/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400).json({ error: "Token ve yeni şifre zorunludur." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Şifre en az 6 karakter olmalıdır." });
    return;
  }

  const emailAuths = await db.select().from(emailAuthTable).where(eq(emailAuthTable.resetToken, token));
  if (emailAuths.length === 0) {
    res.status(400).json({ error: "Geçersiz veya süresi dolmuş bağlantı." });
    return;
  }

  const emailAuth = emailAuths[0];
  if (emailAuth.resetTokenExpires && emailAuth.resetTokenExpires < new Date()) {
    res.status(400).json({ error: "Şifre sıfırlama bağlantısının süresi dolmuş." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(emailAuthTable)
    .set({ passwordHash, resetToken: null, resetTokenExpires: null })
    .where(eq(emailAuthTable.id, emailAuth.id));

  res.json({ success: true, message: "Şifren başarıyla güncellendi. Giriş yapabilirsin." });
});

export default router;
