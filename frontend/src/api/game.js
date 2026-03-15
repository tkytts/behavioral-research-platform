import client from "./client";

export const fetchConfederate = () => client.get("/game/confederate").then(r => r.data);
