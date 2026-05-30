export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: "ok", service: "learniq-api", version: "1.0.0" });
}
