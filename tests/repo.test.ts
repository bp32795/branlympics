import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeCosmos } from "./fake-cosmos";

// Fresh module registry per test so the db singleton resets.
beforeEach(() => {
  vi.resetModules();
  installFakeCosmos();
});

describe("repo: users", () => {
  it("first created user becomes admin, second does not", async () => {
    const { createUser } = await import("@/lib/repo");
    const a = await createUser({
      email: "a@x.com",
      name: "A",
      provider: "credentials",
    });
    const b = await createUser({
      email: "b@x.com",
      name: "B",
      provider: "credentials",
    });
    expect(a.isAdmin).toBe(true);
    expect(b.isAdmin).toBe(false);
  });

  it("getUserByEmail is case-insensitive", async () => {
    const { createUser, getUserByEmail } = await import("@/lib/repo");
    await createUser({
      email: "Mixed@Case.com",
      name: "M",
      provider: "credentials",
    });
    const found = await getUserByEmail("MIXED@case.COM");
    expect(found?.name).toBe("M");
  });
});

describe("repo: signups", () => {
  it("createSignup + getSignup roundtrip", async () => {
    const { createUser, createGame, createSignup, getSignup } = await import(
      "@/lib/repo"
    );
    const u = await createUser({
      email: "u@x.com",
      name: "U",
      provider: "credentials",
    });
    const g = await createGame({
      title: "Beer Pong",
      description: "cups",
      minTeamSize: 2,
      maxTeamSize: 2,
      createdBy: u.id,
    });
    const s = await createSignup(g.id, u.id);
    const fetched = await getSignup(g.id, u.id);
    expect(fetched?.id).toBe(s.id);
  });

  it("deleting a game removes its signups", async () => {
    const { createUser, createGame, createSignup, deleteGame, listSignupsForGame } =
      await import("@/lib/repo");
    const u = await createUser({
      email: "u@x.com",
      name: "U",
      provider: "credentials",
    });
    const g = await createGame({
      title: "X",
      description: "y",
      minTeamSize: 1,
      maxTeamSize: 1,
      createdBy: u.id,
    });
    await createSignup(g.id, u.id);
    await deleteGame(g.id);
    expect(await listSignupsForGame(g.id)).toEqual([]);
  });
});
