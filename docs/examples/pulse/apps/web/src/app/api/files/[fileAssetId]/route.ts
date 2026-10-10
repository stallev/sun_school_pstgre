import { NextResponse } from "next/server";

import { createPresignedReadUrlForFileAsset } from "@/data/file-asset/presign-read.server";

type RouteContext = {
  params: Promise<{ fileAssetId: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { fileAssetId } = await context.params;

  const presignedUrl = await createPresignedReadUrlForFileAsset(fileAssetId);
  if (!presignedUrl) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const upstream = await fetch(presignedUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=300",
    },
  });
}
