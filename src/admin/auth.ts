import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Простая авторизация админки: один пароль из ADMIN_PASSWORD, подписанная cookie на 30 дней.
const COOKIE = "admin_session";

function sign(value: string) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET не задан");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function checkPassword(input: string): boolean {
  const real = process.env.ADMIN_PASSWORD ?? "";
  const a = Buffer.from(sign(input));
  const b = Buffer.from(sign(real));
  return real.length > 0 && timingSafeEqual(a, b);
}

export async function startSession() {
  (await cookies()).set(COOKIE, sign("admin"), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const v = (await cookies()).get(COOKIE)?.value;
  return !!v && v === sign("admin");
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
