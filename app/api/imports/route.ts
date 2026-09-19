import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api";
import {
  importAttendanceCsv,
  importStudentsCsv,
  importVirtualEvidenceCsv,
} from "@/lib/import-service";
import { audit } from "@/lib/audit";
import { importVirtualSessionsCsv } from "@/lib/session-import";
import { assertSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("attendance_write");
    if (auth.response) return auth.response;
    const session = auth.session!;

    const form = await request.formData();
    const kind = String(form.get("kind") ?? "");
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 413 });
    }

    const csv = await file.text();
    let result;

    if (kind === "students") {
      result = await importStudentsCsv({
        orgId: session.orgId,
        userId: session.userId,
        filename: file.name,
        csv,
      });
    } else if (kind === "attendance") {
      result = await importAttendanceCsv({
        orgId: session.orgId,
        userId: session.userId,
        filename: file.name,
        csv,
      });
    } else if (kind === "virtual_evidence") {
      result = await importVirtualEvidenceCsv({
        orgId: session.orgId,
        userId: session.userId,
        filename: file.name,
        csv,
      });
    } else if (kind === "virtual_sessions") {
      result = await importVirtualSessionsCsv({
        orgId: session.orgId,
        userId: session.userId,
        filename: file.name,
        csv,
      });
    } else {
      return NextResponse.json({ error: "Unsupported import kind." }, { status: 400 });
    }

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "import.completed",
      entityType: "import",
      entityId: result.importId,
      metadata: {
        kind,
        filename: file.name,
        rowsTotal: result.rowsTotal,
        rowsSucceeded: result.rowsSucceeded,
        rowsFailed: result.rowsFailed,
      },
      request,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed." },
      { status: 400 },
    );
  }
}
