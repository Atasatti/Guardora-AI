"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { config } from "@/lib/config";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        ux_mode?: "popup" | "redirect";
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: Record<string, string | number>
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

// Google's own button, rendered by Google Identity Services. Hidden entirely
// until NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured.
export function GoogleSignIn({
  onCredential,
  disabled = false,
}: {
  onCredential: (credential: string) => void;
  disabled?: boolean;
}) {
  const clientId = config.auth.googleClientId;
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const container = containerRef.current;
    const google = window.google;
    if (!clientId || !scriptReady || !container || !google) return;

    google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: "popup",
      callback: ({ credential }) => {
        if (credential) callbackRef.current(credential);
      },
    });
    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "center",
      width: Math.max(200, Math.min(container.offsetWidth || 400, 400)),
    });
  }, [clientId, scriptReady]);

  if (!clientId) return null;

  return (
    <div className="mb-6 space-y-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div
        ref={containerRef}
        aria-busy={disabled}
        className={`flex min-h-11 w-full justify-center ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      />
      <p className="text-center text-xs text-muted-foreground">
        Google sign-in is for administrators.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          or use your password
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
