import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { SERVER_BASE } from "@/components/config/server";

export const dynamic = "force-dynamic"; // disable caching

export async function GET() {
  const remoteUrl = `${SERVER_BASE}/Account/FrontendAccList.json`;
  try {
    const res = await fetch(remoteUrl, { cache: "no-store" });
    if (res.ok) {
      try {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        return NextResponse.json(arr, { headers: { "Cache-Control": "no-store" } });
      } catch (e) {
        // fallthrough to local
      }
    }
  } catch {}

  // Fallback to local file (useful in dev)
  try {
    const path = "/Users/stark/Documents/ProjectLaporan/server-app/Account/FrontendAccList.json";
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [];
    return NextResponse.json(arr, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
