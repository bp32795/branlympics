import "server-only";
import { CosmosClient, Container, Database } from "@azure/cosmos";
import { env } from "./env";

type ContainerKey = "users" | "games" | "signups" | "teamRequests";

const PARTITION_KEYS: Record<ContainerKey, string> = {
  users: "/id",
  games: "/id",
  signups: "/gameId",
  teamRequests: "/toUserId",
};

let _client: CosmosClient | null = null;
let _db: Database | null = null;
const _containers: Partial<Record<ContainerKey, Container>> = {};
let _initPromise: Promise<void> | null = null;

function client(): CosmosClient {
  if (!_client) {
    _client = new CosmosClient({
      endpoint: env.cosmosEndpoint,
      key: env.cosmosKey,
    });
  }
  return _client;
}

async function ensureInitialized(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const { database } = await client().databases.createIfNotExists({
      id: env.cosmosDatabase,
    });
    _db = database;
    for (const [name, pk] of Object.entries(PARTITION_KEYS) as [
      ContainerKey,
      string,
    ][]) {
      const { container } = await _db.containers.createIfNotExists({
        id: name,
        partitionKey: { paths: [pk] },
      });
      _containers[name] = container;
    }
  })();
  return _initPromise;
}

export async function getContainer(name: ContainerKey): Promise<Container> {
  await ensureInitialized();
  const c = _containers[name];
  if (!c) throw new Error(`Container ${name} not initialized`);
  return c;
}
