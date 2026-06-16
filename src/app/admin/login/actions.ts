"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE_NAME, expectedAdminCookieValue } from "@/lib/adminAuth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!process.env.ADMIN_SECRET || password !== process.env.ADMIN_SECRET) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, expectedAdminCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/admin");
}
