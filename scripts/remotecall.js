// import { Process } from "yao-node-client";
//
function MyProcess(...args) {
  
  return Process("scripts.jsproxy.RemoteProcess", "scripts.ping.Ping", ...args);
}
