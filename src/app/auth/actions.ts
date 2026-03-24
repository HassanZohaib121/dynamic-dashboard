"use server";

import { auth } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signUpAction(name: string, email: string, password: string) {
  try {
    if (!name || !email || !password) {
      throw new Error( "Name, Email and password are required" )
    }
    await auth.api.signUpEmail({
        body: {
            name,
            email,
            password,
        }
    })
  } catch (e) {
    if (e instanceof APIError) {
      return { error: e.message };
    }
    return { error: "Something went wrong" };
  }
  redirect("/dashboard");
}

export async function signInAction(email: string, password: string) {
  try {
    if (!email || !password) {
      throw new Error ("Email and password are required" )
    }
    await auth.api.signInEmail({
      body: { email, password },
    });
  } catch (e) {
    if (e instanceof APIError) {
      return { error: e.message };
    }
    return { error: "Invalid email or password" };
  }
  redirect("/dashboard");
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/auth/login");
}