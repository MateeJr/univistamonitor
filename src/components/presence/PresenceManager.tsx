"use client";

import React, { useEffect, useRef } from "react";
import { ENDPOINTS } from "@/components/config/server";

type Profile = {
  loginId: string;
  adminName: string;
  signedInAt: string;
};

const STORAGE_KEY = "@akun/profile";
const TOKEN_COOKIE = "uv_token";
const CLIENT_ID_KEY = "@akun/client-id";

function getCookie(k: string) {
  try {
    return document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${k}=`))
      ?.split("=")[1];
  } catch {
    return undefined;
  }
}

function getClientId(): string {
  try {
    let id: string = localStorage.getItem(CLIENT_ID_KEY) || "";
    if (!id) {
      const hasCrypto = typeof crypto !== "undefined" && (crypto as any).randomUUID;
      id = hasCrypto ? (crypto as any).randomUUID() : `web-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return `web-${Date.now().toString(36)}`;
  }
}

async function sendPresence(profile: Profile | null, status: "online" | "offline") {
  try {
    if (!profile?.loginId) return;
    const cid = getClientId();
    await fetch(ENDPOINTS.logininfo, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.loginId, status, clientId: cid }),
      keepalive: status === "offline",
    });
  } catch {}
}

export default function PresenceManager() {
  const hbRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const profileRef = useRef<Profile | null>(null);

  const startHeartbeat = () => {
    if (hbRef.current) return;
    sendPresence(profileRef.current, "online");
    hbRef.current = setInterval(() => sendPresence(profileRef.current, "online"), 30_000);
  };
  const stopHeartbeat = (sendOffline?: boolean) => {
    if (hbRef.current) {
      clearInterval(hbRef.current);
      hbRef.current = null;
    }
    if (sendOffline && profileRef.current?.loginId) {
      try {
        const cid = getClientId();
        const payload = new Blob([JSON.stringify({ name: profileRef.current.loginId, status: "offline", clientId: cid })], { type: "application/json" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINTS.logininfo, payload);
          return;
        }
      } catch {}
      sendPresence(profileRef.current, "offline");
    }
  };

  useEffect(() => {
    // Initial profile/token check
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const token = getCookie(TOKEN_COOKIE);
      if (raw && token) {
        const parsed: Profile = JSON.parse(raw);
        if (parsed?.loginId) {
          profileRef.current = parsed;
          startHeartbeat();
          sendPresence(profileRef.current, "online");
        }
      }
    } catch {}

    // Page/tab lifecycle
    const onVis = () => { if (document.visibilityState === "visible" && profileRef.current) sendPresence(profileRef.current, "online"); };
    const onHide = () => { if (profileRef.current) stopHeartbeat(true); };
    const onShow = () => { if (profileRef.current) { startHeartbeat(); sendPresence(profileRef.current, "online"); } };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    window.addEventListener("pageshow", onShow);

    // React to storage changes (login/logout from another tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          const token = getCookie(TOKEN_COOKIE);
          if (!e.newValue || !token) {
            // Logged out
            profileRef.current = null;
            stopHeartbeat(true);
          } else {
            // Logged in / updated
            const parsed: Profile = JSON.parse(e.newValue);
            if (parsed?.loginId) {
              profileRef.current = parsed;
              startHeartbeat();
              sendPresence(profileRef.current, "online");
            }
          }
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);

    // React to explicit same-tab changes
    const onProfileChanged = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as { profile: Profile | null; action?: string } | undefined;
        const token = getCookie(TOKEN_COOKIE);
        if (!detail || !token) {
          profileRef.current = null;
          stopHeartbeat(true);
          return;
        }
        profileRef.current = detail.profile;
        if (profileRef.current?.loginId) {
          startHeartbeat();
          sendPresence(profileRef.current, "online");
        } else {
          stopHeartbeat(true);
        }
      } catch {}
    };
    window.addEventListener("uv:profile-changed", onProfileChanged as EventListener);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("uv:profile-changed", onProfileChanged as EventListener);
      stopHeartbeat(true);
    };
  }, []);

  return null;
}
