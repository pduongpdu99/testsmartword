import { Redis } from "@upstash/redis";

// const redis = Redis.fromEnv(); // hoặc new Redis({ url, token })
const redis = Redis({
  url: "redis://default:guMy1YAlLLBgztELGS9ehf7RaEJAguAp@redis-11202.c1.us-central1-2.gce.cloud.redislabs.com:11202",
});

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

// Broadcast dùng Pub/Sub
export function broadcast(event, data) {
  redis.publish("smartfood:updates", JSON.stringify({ type: event, data }));
}
