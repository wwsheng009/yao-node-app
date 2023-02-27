//代理js api请求
// import { Store, Studio, WebSocket } from "yao-node-client";
// import { Exception, Process, Query } from "yao-node-client";
// import { $L, FS, http, log } from "yao-node-client";
/**
 * api 代理服务，可以放在yao应用下
 * @param {object} payload
 * @returns
 */
function Server(payload) {
  // console.log("request received");
  // console.log(payload);
  // log.Info("debug served called");
  // log.Info(payload);
  // JSON.stringify({'a':null,'b':undefined})
  // '{"a":null}'
  let resp = {
    code: 200,
    message: "",
    // error: null as Error, //undefined不会出现在返回json key中
    data: null,
  };
  try {
    const type = payload.type;
    const method = payload.method;
    const args = payload.args;
    const space = payload.space; //"dsl","script","system"
    let localParams = [];
    if (Array.isArray(args)) {
      localParams = args;
    } else {
      localParams.push(args);
    }
    switch (type) {
      case "Process":
        resp.data = Process(method, ...localParams);
        break;
      case "Studio":
        // @ts-ignore
        __YAO_SU_ROOT = true;
        resp.data = Studio(method, ...localParams);
        break;
      case "Query":
        const query = new Query();
        resp.data = query[method](args);
        break;
      case "FileSystem":
        const fs = new FS(space);
        resp.data = fs[method](...args);
        break;
      case "Store":
        const cache = new Store(space);
        if (method == "Set") {
          resp.data = cache.Set(payload.key, payload.value);
        } else if (method == "Get") {
          resp.data = cache.Get(payload.key);
        }
        break;
      case "Http":
        resp.data = http[method](...args);
        break;
      case "Log":
        // console.log("Log args:", args);
        log[method](...args);
        resp.data = {};
        break;
      case "WebSocket":
        //目前yao只是实现了push一个方法，也是ws服务连接后push一条信息
        const ws = new WebSocket(payload.url, payload.protocols);
        if (method == "push") {
          ws.push(payload.message);
          resp.data = {};
        }
        break;
      case "Translate":
        resp.data = $L(payload.message);
        break;
      default:
        break;
    }
  } catch (error) {
    resp.code = error.code || 500;
    resp.message = error.message || "接口调用异常";
    // resp.error = error;
  }
  return resp;
}
// 在外部按这个个格式调用
// function MyProcess(...args: any[]) {
//   return Process("scripts.jsproxy.RemoteProcess", ...args);
// }
//call remote client
//call scripts.jsproxy.Process()
function RemoteProcess(method, ...args) {
  if (!(typeof method === "string")) {
    throw new Exception("方法格式不正确", 500);
  }
  const types = method.split(".");
  if (!types.length) {
    throw new Exception("方法格式不正确", 500);
  }
  const type = types[0].toLowerCase();
  if (!["scripts", "services", "studio"].includes(type)) {
    throw new Exception(`不支持的方法:${method}/${type}`, 500);
  }
  return RemoteClient("Process", method, ...args);
}
//需要在yao引用里进行调用
function RemoteClient(type, method, ...args) {
  let server = Process("utils.env.Get", "REMOTE_DEBUG_SERVER");
  let ret = http.Post(server, {
    method: method,
    type: type,
    args: args,
  });
  if (ret.code != 200) {
    throw Error(`远程程序执行异常:代码:${ret.code},消息：${ret.message}`);
  }
  return ret.data;
}
