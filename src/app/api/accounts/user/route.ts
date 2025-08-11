import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { SERVER_BASE } from "@/components/config/server";

export const dynamic = "force-dynamic"; // disable caching

export async function GET() {
  const remoteUrl = `${SERVER_BASE}/Account/AccountList.json`;
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
    const path = "/Users/stark/Documents/ProjectLaporan/server-app/Account/AccountList.json";
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [];
    return NextResponse.json(arr, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }
}

// Delete a user account by name from the local dev store.
// This edits FrontendAccList.json directly (dev-only behavior).
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const nameRaw = typeof body?.name === "string" ? body.name : "";
    const name = nameRaw.trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Missing 'name'" }, { status: 400 });
    }

    // Try remote server first
    try {
      const remoteUrl = `${SERVER_BASE}/frontend/auth/delete`;
      const r = await fetch(remoteUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j && typeof j === "object" && "ok" in j) {
          return NextResponse.json(j, { headers: { "Cache-Control": "no-store" } });
        }
      }
      // fallthrough to local
    } catch {}

    const path = "/Users/stark/Documents/ProjectLaporan/server-app/Account/FrontendAccList.json";
    let arr: any[] = [];
    try {
      const raw = await readFile(path, "utf8");
      const data = JSON.parse(raw);
      arr = Array.isArray(data) ? data : [];
    } catch {}

    const next = arr.filter((u) => !(u && typeof u === "object" && u.name === name));
    await writeFile(path, JSON.stringify(next, null, 2), "utf8");
    return NextResponse.json({ ok: true, deleted: arr.length - next.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to delete" }, { status: 500 });
  }
}
