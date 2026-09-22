import { apiSession, errorResponse } from "@/lib/api";
import { exportOperatorWorkspace } from "@/lib/operator/account";

export async function GET() {
  const auth = await apiSession("admin");
  if (!auth.session) return auth.response;

  if (auth.session.role !== "owner") {
    return new Response(
      JSON.stringify({ error: "Only the workspace owner can export the complete workspace." }),
      { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  try {
    const data = await exportOperatorWorkspace(auth.session.orgId);
    const filename =
      "operator-export-" +
      auth.session.orgSlug.replace(/[^a-z0-9-]/gi, "-") +
      "-" +
      new Date().toISOString().slice(0, 10) +
      ".json";

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + filename + '"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error, "Unable to export workspace.");
  }
}
