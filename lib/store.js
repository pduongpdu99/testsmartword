import { Redis } from "@upstash/redis";

// const redis = Redis.fromEnv(); // hoặc new Redis({ url, token })
const redis = new Redis({
  url: "https://redis-11202.c1.us-central1-2.gce.cloud.redislabs.com:11202",
  token: "guMy1YAlLLBgztELGS9ehf7RaEJAguAp",
});

// Client management for SSE
const clients = new Map();

export function registerClient(res) {
  const clientId = Date.now() + Math.random();
  clients.set(clientId, res);
  return clientId;
}

export function unregisterClient(clientId) {
  clients.delete(clientId);
}

export function clientCount() {
  return clients.size;
}

export async function getState() {
  const s = await redis.get("smartfood:state");
  return s || { queue: [], counter: 0, serving: 0 };
}

export async function setState(updater) {
  const prev = await getState();
  const next = updater(prev);
  await redis.set("smartfood:state", next);
  await redis.publish(
    "smartfood:updates",
    JSON.stringify({ type: "state", data: next }),
  );
}

// Broadcast dùng Pub/Sub and SSE
export function broadcast(event, data) {
  // Send to Redis for other instances
  redis.publish("smartfood:updates", JSON.stringify({ type: event, data }));
  // Send to local SSE clients
  for (const res of clients.values()) {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      // Client might be disconnected
    }
  }
}
