import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { SERVER_BASE } from "@/components/config/server";

export const dynamic = "force-dynamic"; // disable caching

export async function GET() {
  // Try server endpoint for user accounts first
  try {
    const res = await fetch(`${SERVER_BASE}/auth/accounts`, { cache: "no-store" });
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      if (j && typeof j === "object" && Array.isArray((j as any).accounts)) {
        return NextResponse.json((j as any).accounts, { headers: { "Cache-Control": "no-store" } });
      }
    }
  } catch {}

  // Fallback to local file (useful in dev) - USERS are in AccountList.json
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
// This edits AccountList.json (user accounts), not FrontendAccList.json (admin accounts).
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const nameRaw = typeof body?.name === "string" ? body.name : "";
    const name = nameRaw.trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Missing 'name'" }, { status: 400 });
    }

    // Try remote server first - use regular auth/logout to remove user
    try {
      const remoteUrl = `${SERVER_BASE}/auth/logout`;
      const r = await fetch(remoteUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status: "logout" }),
      });
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j && typeof j === "object" && "ok" in j) {
          return NextResponse.json({ ok: true, deleted: 1 }, { headers: { "Cache-Control": "no-store" } });
        }
      }
      // fallthrough to local
    } catch {}

    // Fallback: edit local user accounts file
    const path = "/Users/stark/Documents/ProjectLaporan/server-app/Account/AccountList.json";
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
