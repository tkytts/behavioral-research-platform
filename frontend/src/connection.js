import * as signalR from "@microsoft/signalr";
import config from "./config";

const connection = new signalR.HubConnectionBuilder()
  .withUrl(config.hubUrl)
  .withAutomaticReconnect()
  .build();

let resolveReady;
export let connectionReady = new Promise(resolve => { resolveReady = resolve; });

connection.onreconnecting(() => {
  // Replace with a new pending promise so invokeWhenReady waits during reconnection
  connectionReady = new Promise(resolve => { resolveReady = resolve; });
});

connection.onreconnected(() => resolveReady());

connection.start()
  .then(() => resolveReady())
  .catch(() => resolveReady()); // resolve on failure too; invoke will throw naturally

if (!connection.emit) {
  connection.emit = connection.invoke.bind(connection);
}

export default connection;
