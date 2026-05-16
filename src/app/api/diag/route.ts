import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = { ok: true, steps: [] };
  const steps = out.steps as string[];
  try {
    steps.push("env check");
    out.env = {
      cosmosEndpoint: !!process.env.COSMOS_ENDPOINT,
      cosmosKey: !!process.env.COSMOS_KEY,
      cosmosDatabase: process.env.COSMOS_DATABASE ?? null,
      authUrl: process.env.AUTH_URL ?? null,
      authSecret: !!process.env.AUTH_SECRET,
      nodeVersion: process.version,
    };

    steps.push("import repo");
    const repo = await import("@/lib/repo");

    steps.push("listGames");
    const games = await repo.listGames();
    out.gameCount = games.length;

    steps.push("countUsers");
    out.userCount = await repo.countUsers();

    return NextResponse.json(out);
  } catch (err) {
    const e = err as Error & { code?: string | number };
    return NextResponse.json(
      {
        ok: false,
        steps: out.steps,
        env: out.env,
        error: {
          name: e.name,
          message: e.message,
          code: e.code,
          stack: e.stack?.split("\n").slice(0, 10),
        },
      },
      { status: 500 }
    );
  }
}
