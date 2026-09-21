"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type CredentialResponse = { credential?: string };
type GoogleAccounts = {
  id: {
    initialize(options: {
      client_id: string;
      callback: (response: CredentialResponse) => void;
      nonce: string;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
      use_fedcm_for_prompt?: boolean;
    }): void;
    renderButton(element: HTMLElement, options: Record<string, string | number>): void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

type Props = {
  onSuccess: (role: string) => void;
  onTwoFactor: (challenge: string) => void;
};

export default function GoogleSignInButton({ onSuccess, onTwoFactor }: Props) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const renderButton = useCallback(() => {
    const target = buttonRef.current;
    if (!target || !window.google) return;
    const availableWidth = Math.max(220, Math.floor(target.getBoundingClientRect().width));
    target.replaceChildren();
    window.google.accounts.id.renderButton(target, {
      type: "standard",
      shape: "pill",
      theme: "outline",
      text: "continue_with",
      size: "large",
      logo_alignment: "left",
      width: Math.min(320, availableWidth),
    });
  }, []);

  const initialize = useCallback(async () => {
    if (!clientId || !window.google || !buttonRef.current || initializing.current) return;
    initializing.current = true;
    setError("");
    try {
      const nonceResponse = await fetch("/api/auth/google/nonce", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const nonceData = await nonceResponse.json();
      if (!nonceResponse.ok || !nonceData.nonce) {
        throw new Error(nonceData.error || "Google sign-in is unavailable.");
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: nonceData.nonce,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        callback: async ({ credential }) => {
          if (!credential) {
            setError("Google did not return a sign-in credential.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ credential }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Google sign-in failed.");
            if (data.requiresTwoFactor) onTwoFactor(data.challenge);
            else onSuccess(data.role || "USER");
          } catch (signInError) {
            setError(signInError instanceof Error ? signInError.message : "Google sign-in failed.");
            initializing.current = false;
            void initialize();
          } finally {
            setBusy(false);
          }
        },
      });

      renderButton();
    } catch (initializationError) {
      setError(initializationError instanceof Error ? initializationError.message : "Google sign-in is unavailable.");
    } finally {
      initializing.current = false;
    }
  }, [clientId, onSuccess, onTwoFactor, renderButton]);

  useEffect(() => {
    if (window.google) void initialize();
  }, [initialize]);

  useEffect(() => {
    const target = buttonRef.current;
    if (!target || typeof ResizeObserver === "undefined") return;
    let previousWidth = 0;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      if (window.google && width > 0 && width !== previousWidth) {
        previousWidth = width;
        renderButton();
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [renderButton]);

  if (!clientId) {
    return <p className="text-center text-xs text-fog">Google sign-in will appear after its client ID is configured.</p>;
  }

  return (
    <div className="space-y-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => void initialize()}
        onError={() => setError("Google sign-in could not be loaded. Check your connection and try again.")}
      />
      <div className={`min-w-0 overflow-hidden ${busy ? "pointer-events-none opacity-60" : ""}`} aria-busy={busy}>
        <div ref={buttonRef} className="flex min-h-11 w-full min-w-0 justify-center overflow-hidden" />
      </div>
      {busy && <p className="text-center text-xs text-fog">Signing in securely…</p>}
      {error && <p role="alert" className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
