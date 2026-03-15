import * as signalR from "@microsoft/signalr";
import config from "./config";

const connection = new signalR.HubConnectionBuilder()
  .withUrl(config.hubUrl)
  .withAutomaticReconnect()
  .build();

let resolveReady;
export let connectionReady = new Promise(resolve => { resolveReady = resolve; });

const listeners = [];
export const onConnectionStatusChange = (fn) => {
  listeners.push(fn);
  return () => listeners.splice(listeners.indexOf(fn), 1);
};
const notify = (status) => listeners.forEach(fn => fn(status));

connection.onreconnecting(() => {
  // Replace with a new pending promise so invokeWhenReady waits during reconnection
  connectionReady = new Promise(resolve => { resolveReady = resolve; });
  notify('reconnecting');
});

connection.onreconnected(() => { resolveReady(); notify('connected'); });

connection.start()
  .then(() => { resolveReady(); notify('connected'); })
  .catch(() => { resolveReady(); notify('failed'); }); // resolve on failure too; invoke will throw naturally

if (!connection.emit) {
  connection.emit = connection.invoke.bind(connection);
}

export default connection;
