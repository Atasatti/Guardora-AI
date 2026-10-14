"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { login, loginWithGoogle } from "@/lib/actions/auth";

type SignInResult = { success: boolean; message: string; role?: string };

export function useLoginViewModel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function finishSignIn(result: SignInResult) {
    if (result.success) {
      toast.success(result.message);
      router.push(result.role === "RESIDENT" ? "/resident" : "/");
      return;
    }

    toast.error(result.message);
    setLoading(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    finishSignIn(await login({ email, password }));
  }

  async function signInWithGoogle(credential: string) {
    setLoading(true);
    finishSignIn(await loginWithGoogle(credential));
  }

  return {
    email,
    password,
    loading,
    setEmail,
    setPassword,
    submit,
    signInWithGoogle,
  };
}
