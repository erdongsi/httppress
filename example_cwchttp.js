const path = require("path");

const helper = require("./utils/helper");
const cmd = require("./utils/cmd");
const logs = require("./utils/logs");

const httprouter = require("./src/httprouter");
const httpserver = require("./src/httpserver");

const mycmd = require("./mycmd");
const helloworld = require("./helloworld");

logs.getInst().setID("example_cwchttp",2);

// 0.make mycmd
cmd.start(mycmd.doCmd);

// 1.create & init http routers.
let _http_router = new httprouter();

_http_router.on('/helloworld', (args)=>{ helloworld.getInst().handle(args); });

// 2.create http web server.
let _ip = helper.getLocalIpv4Address();
let _port = 80;

let _http_server = new httpserver();
_http_server.createHttp(_ip, _port, _http_router);

exports.getIP = function() {
    return _ip;
}
exports.getPort = function() {
    return _port;
}

