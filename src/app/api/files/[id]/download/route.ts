import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { FileService } from "@/modules/file/file.service";
import { ShareService } from "@/modules/sharing/share.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");

  try {
    let hasShareAccess = false;
    let user = await getCurrentUser();

    if (token) {
      const shareResult = await ShareService.validateToken(token);
      if (shareResult.status === "VALID") {
        hasShareAccess = true;
      }
    }

    if (!user && !hasShareAccess) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const download = await FileService.downloadFile(id, user, hasShareAccess);

    return new NextResponse(download.stream as any, {
      status: 200,
      headers: {
        "Content-Type": download.mimeType,
        "Content-Length": download.size.toString(),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(download.filename)}"`,
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || "File download error", { status: 400 });
  }
}
