import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { FileService } from "@/modules/file/file.service";
import { ShareService } from "@/modules/sharing/share.service";
import { Readable } from "stream";

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

    const { stream, zipFilename } = await FileService.createZipArchive(id, user, hasShareAccess);

    // Convert node PassThrough stream to web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(zipFilename)}"`,
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || "Download all error", { status: 400 });
  }
}
