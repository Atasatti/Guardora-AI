"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "../api-client";
import { createSessionToken } from "../auth-token";
import { fetchWithAuth, handleApiResponse } from "../server-utils";
import type { LoginResponse } from "@/models";

async function storeSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

function secureEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

async function tryBootstrapAdmin(credentials: {
  email: string;
  password: string;
}) {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET_KEY;

  if (!email || !password || !jwtSecret) {
    return false;
  }

  const submittedEmail = credentials.email.trim().toLowerCase();
  if (
    !secureEqual(submittedEmail, email) ||
    !secureEqual(credentials.password, password)
  ) {
    return false;
  }

  const token = await createSessionToken(
    {
      id: "bootstrap-admin",
      email,
      role: "ADMIN",
    },
    jwtSecret
  );
  await storeSessionCookie(token);

  return true;
}

export async function login(credentials: { email: string; password: string }) {
  try {
    if (await tryBootstrapAdmin(credentials)) {
      return {
        success: true,
        message: "Login successful",
        role: "ADMIN",
      };
    }

    if (!API_BASE_URL) {
      return { success: false, message: "Invalid email or password" };
    }

    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { success: false, message: errorData.message || "Login failed." };
    }

    const data: LoginResponse = await res.json();

    if (data.success && data.user && data.token) {
      await storeSessionCookie(data.token);

      return {
        success: true,
        message: "Login successful",
        role: data.user.role,
      };
    } else {
      return {
        success: false,
        message: data.message || "Invalid response from server.",
      };
    }
  } catch (error) {
    console.error("Login action error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}

// Exchanges a Google Identity Services credential for a Guardora session.
// The backend verifies it and admits administrators only.
export async function loginWithGoogle(credential: string) {
  try {
    if (!API_BASE_URL) {
      return { success: false, message: "Google sign-in is not available" };
    }

    const res = await fetch(`${API_BASE_URL}/users/google-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential }),
      cache: "no-store",
    });
    const data: LoginResponse = await res.json();

    if (!res.ok || !data.success || !data.user || !data.token) {
      return {
        success: false,
        message: data.message || "Google sign-in failed.",
      };
    }

    await storeSessionCookie(data.token);
    return {
      success: true,
      message: "Login successful",
      role: data.user.role,
    };
  } catch (error) {
    console.error("Google login action error:", error);
    return { success: false, message: "Google sign-in failed." };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("token", "", { expires: new Date(0) });
  redirect("/login");
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function changePassword(data: any) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/users/change-password`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

    const result = await handleApiResponse<{ message: string }>(response);

    if (result.success) {
      return { success: true, message: result.data.message };
    }
    return result;
  } catch (error) {
    console.log(error);
    return { success: false, message: "Failed to update password" };
  }
}
