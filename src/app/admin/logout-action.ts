"use server";

import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

/**
 * Server Action: Logout do admin.
 * Deleta o cookie de sessão JWT e redireciona para /admin/login.
 */
export async function logoutAction() {
  await deleteSession();
  redirect("/admin/login");
}
