"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { LeadStatus } from "@/generated/prisma/client";

export async function updateLeadStatus(id: string, status: LeadStatus) {
  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
