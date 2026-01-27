import path from "node:path";
import fs from "node:fs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { consumeDownloadToken } from "@/lib/downloadTokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Validate + consume token (enforces expiry + single-use)
    const record = await consumeDownloadToken(token);
    if (!record) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
    }

    // PRIVATE FILE LOCATION (must exist on disk)
    const filePath = path.join(process.cwd(), "private_downloads", "Exalted-Josie.zip");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found on server" }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const stream = fs.createReadStream(filePath);

    return new NextResponse(Readable.toWeb(stream) as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(stat.size),
        "Content-Disposition": 'attachment; filename="Exalted-Josie.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
