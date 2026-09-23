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
  const [nativeGoogle, setNativeGoogle] = useState(false);

  const completeSignIn = useCallback(async (credential: string) => {
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
    } finally {
      setBusy(false);
    }
  }, [onSuccess, onTwoFactor]);

  const requestNonce = useCallback(async () => {
    const response = await fetch("/api/auth/google/nonce", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await response.json();
    if (!response.ok || !data.nonce) throw new Error(data.error || "Google sign-in is unavailable.");
    return String(data.nonce);
  }, []);

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

  const initializeWebGoogle = useCallback(async () => {
    if (nativeGoogle || !clientId || !window.google || !buttonRef.current || initializing.current) return;
    initializing.current = true;
    setError("");
    try {
      const nonce = await requestNonce();
      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        callback: ({ credential }) => {
          if (!credential) setError("Google did not return a sign-in credential.");
          else void completeSignIn(credential);
        },
      });
      renderButton();
    } catch (initializationError) {
      setError(initializationError instanceof Error ? initializationError.message : "Google sign-in is unavailable.");
    } finally {
      initializing.current = false;
    }
  }, [clientId, completeSignIn, nativeGoogle, renderButton, requestNonce]);

  const beginNativeGoogle = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/google/native-nonce", { cache: "no-store", credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok || !data.nonce) throw new Error(data.error || "Google sign-in is unavailable.");
      window.AniPinsAndroid?.signInWithGoogle?.(String(data.nonce));
    } catch (nativeError) {
      setBusy(false);
      setError(nativeError instanceof Error ? nativeError.message : "Google sign-in is unavailable.");
    }
  }, [requestNonce]);

  useEffect(() => {
    setNativeGoogle(typeof window.AniPinsAndroid?.signInWithGoogle === "function");
  }, []);

  useEffect(() => {
    const onCredential = (event: Event) => {
      const credential = (event as CustomEvent<{ credential?: string }>).detail?.credential;
      if (!credential) {
        setBusy(false);
        setError("Google did not return a sign-in credential.");
        return;
      }
      void completeSignIn(credential);
    };
    const onError = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message || "Google sign-in failed.";
      setBusy(false);
      const lower = message.toLowerCase();
      if (nativeGoogle && (lower.includes("reauth") || lower.includes("[16]") || lower.includes("google sign-in failed"))) {
        setError("");
        setNativeGoogle(false);
        return;
      }
      setError(message);
    };
    window.addEventListener("anipins-native-google-credential", onCredential);
    window.addEventListener("anipins-native-google-error", onError);
    return () => {
      window.removeEventListener("anipins-native-google-credential", onCredential);
      window.removeEventListener("anipins-native-google-error", onError);
    };
  }, [completeSignIn]);

  useEffect(() => {
    if (!nativeGoogle && window.google) void initializeWebGoogle();
  }, [initializeWebGoogle, nativeGoogle]);

  useEffect(() => {
    if (nativeGoogle) return;
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
  }, [nativeGoogle, renderButton]);

  if (!clientId) {
    return <p className="text-center text-xs text-fog">Google sign-in will appear after its client ID is configured.</p>;
  }

  return (
    <div className="space-y-3">
      {!nativeGoogle && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onReady={() => void initializeWebGoogle()}
          onError={() => setError("Google sign-in could not be loaded. Check your connection and try again.")}
        />
      )}
      <div className={`min-w-0 overflow-hidden ${busy ? "pointer-events-none opacity-60" : ""}`} aria-busy={busy}>
        {nativeGoogle ? (
          <button
            type="button"
            onClick={() => void beginNativeGoogle()}
            className="flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-black/20 bg-white px-5 text-sm font-medium text-[#1f1f1f] shadow-sm"
          >
            <span aria-hidden="true" className="text-xl font-bold text-[#4285f4]">G</span>
            Continue with Google
          </button>
        ) : (
          <div ref={buttonRef} className="flex min-h-11 w-full min-w-0 justify-center overflow-hidden" />
        )}
      </div>
      {busy && <p className="text-center text-xs text-fog">Signing in securely…</p>}
      {error && <p role="alert" className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
