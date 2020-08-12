// 可以 和 httpserver 配合使用 创建 web 服务器。

const events = require("events");
const url = require("url");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

const helper = require("../utils/helper");
const httpstatic = require("./httpstatic");

class httprouter extends events {
    constructor() {
        super();

        this._name = "httprouter";

        this.routers = {};

        this.on('http.server.to.router.event', (...args)=>{
            helper.log("["+this._name+":constructor] args[0]:", args[0]);
            //helper.log("["+this._name+":constructor] args:", args);
            //helper.log("args.slice(1):", args.slice(1).length);
            if (this.eventIndex(args[0]) >= 0) {
                this.emit(args[0], args.slice(1));
            } else {
                httpstatic.getInst().emit("http.static.event", args[1], args[2]);
            }
        });
    }
    eventIndex(name) {
        let ret = -1;
        this.eventNames().forEach((v,i,a)=>{
            //helper.log(i, v);
            if (v == name) {
                ret = i;
            }
        });
        //helper.log("[httprouter:eventIndex] ret:", ret);
        return ret;
    }
}

module.exports = httprouter;