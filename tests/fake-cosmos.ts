/**
 * In-memory fake for the small slice of @azure/cosmos we use in `@/lib/db`.
 * Each container is a Map keyed by `${pk}::${id}`.
 *
 * Test files import this and call `installFakeCosmos()` once in `beforeEach`
 * to reset state, before importing modules that use the db.
 */
import { vi } from "vitest";

type Doc = Record<string, unknown> & { id: string };

class FakeContainer {
  private docs = new Map<string, Doc>();
  constructor(private partitionKeyPath: string) {}

  private pkOf(doc: Doc): string {
    const key = this.partitionKeyPath.replace(/^\//, "");
    return String(doc[key] ?? doc.id);
  }
  private storeKey(pk: string, id: string) {
    return `${pk}::${id}`;
  }

  items = {
    create: async (doc: Doc) => {
      const pk = this.pkOf(doc);
      const k = this.storeKey(pk, doc.id);
      if (this.docs.has(k)) {
        const err = new Error("Conflict") as Error & { code: number };
        err.code = 409;
        throw err;
      }
      this.docs.set(k, { ...doc });
      return { resource: { ...doc } };
    },
    query: <T>(spec: string | { query: string; parameters?: { name: string; value: unknown }[] }) => {
      const all = [...this.docs.values()];
      const q = typeof spec === "string" ? spec : spec.query;
      const params = typeof spec === "string" ? [] : (spec.parameters ?? []);
      const fetchAll = async () => {
        // Very small SQL-ish interpreter handling the patterns we use.
        // - COUNT(1) → returns [count]
        // - WHERE field = @param (AND of equality, possibly LOWER(c.email) = @e)
        if (/SELECT VALUE COUNT\(1\)/i.test(q)) {
          return { resources: [all.length] as unknown as T[] };
        }
        const whereMatch = q.match(/WHERE (.+?)(?: ORDER BY| GROUP BY|$)/i);
        let filtered = all;
        if (whereMatch) {
          const clause = whereMatch[1];
          const conds = clause.split(/\s+AND\s+/i);
          filtered = all.filter((doc) =>
            conds.every((cond) => {
              // status string literal: c.status = 'pending'
              const litMatch = cond.match(/c\.(\w+)\s*=\s*'([^']*)'/);
              if (litMatch) {
                return String(doc[litMatch[1]]) === litMatch[2];
              }
              const m = cond.match(/(LOWER\()?c\.(\w+)\)?\s*=\s*@(\w+)/);
              if (!m) return true;
              const lower = Boolean(m[1]);
              const field = m[2];
              const paramName = m[3];
              const param = params.find((p) => p.name === `@${paramName}`);
              const left = lower
                ? String(doc[field] ?? "").toLowerCase()
                : doc[field];
              const right = lower
                ? String(param?.value ?? "").toLowerCase()
                : param?.value;
              return left === right;
            }),
          );
        }
        return { resources: filtered as unknown as T[] };
      };
      return { fetchAll };
    },
  };

  item(id: string, pk: string) {
    const k = this.storeKey(pk, id);
    return {
      read: async () => {
        const doc = this.docs.get(k);
        if (!doc) {
          const err = new Error("Not found") as Error & { code: number };
          err.code = 404;
          throw err;
        }
        return { resource: { ...doc } };
      },
      replace: async (doc: Doc) => {
        this.docs.set(k, { ...doc });
        return { resource: { ...doc } };
      },
      delete: async () => {
        this.docs.delete(k);
        return {};
      },
    };
  }

  // Test helpers
  _all(): Doc[] {
    return [...this.docs.values()];
  }
  _clear() {
    this.docs.clear();
  }
}

const containers: Record<string, FakeContainer> = {};

export function installFakeCosmos() {
  // Reset
  for (const key of Object.keys(containers)) delete containers[key];

  vi.doMock("@azure/cosmos", () => {
    class CosmosClient {
      databases = {
        createIfNotExists: async ({ id }: { id: string }) => ({
          database: {
            id,
            containers: {
              createIfNotExists: async ({
                id: cid,
                partitionKey,
              }: {
                id: string;
                partitionKey: { paths: string[] };
              }) => {
                if (!containers[cid]) {
                  containers[cid] = new FakeContainer(partitionKey.paths[0]);
                }
                return { container: containers[cid] };
              },
            },
          },
        }),
      };
    }
    return { CosmosClient };
  });
}

export function getFakeContainer(name: string): FakeContainer {
  const c = containers[name];
  if (!c) throw new Error(`Fake container ${name} not initialized (call something that triggers db init first)`);
  return c;
}
