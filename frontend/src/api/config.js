import client from "./client";

export function getFeatures() {
  return client.get("/config/features");
}
