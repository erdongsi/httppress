// 静态文件服务。

const events = require("events");
const url = require("url");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

const helper = require("../utils/helper");
const httpfile = require("./httpfile");

class httpstatic extends events {

    static getInst() {
        if (helper.isNullOrUndefined(httpstatic.inst)) {
            httpstatic.inst = new httpstatic();
        }
        return httpstatic.inst;
    }

    constructor() {
        super();

        this._name = "httpstatic";

        this._static_folders = [];

        this.on('http.static.event', (...args)=>{
            //helper.log("[httpstatic:constructor] args[0]:", args[0]);
            //helper.log("[httpstatic:constructor] args:", args);
            let request = args[0];
            let response = args[1];
            this.handleStatic(request, response);
        });
    }
    setStaticFolder(folder) {
        if (this._static_folders.indexOf(folder) < 0) {
            this._static_folders.push(folder);
        }
    }
    handleStatic(request, response) {
        helper.log("["+this._name+":handleStatic] (request,response) >>>>>");

        let req_msg = url.parse(request.url, true, false);
        let path_name = req_msg.pathname;
        path_name = path_name.replace(/\\/g,'/');
        {
            let ret = "";
            let ss = path_name.split('/');
            ss.forEach((s)=>{
                if (s.trim().length>0) {
                    if (ret.length > 0) {
                        ret += "/";
                    }
                    ret += s;
                }
            });
            path_name = ret;
        }
        helper.log("["+this._name+":handleStatic] path_name:", path_name);

        if (path_name.length <= 0 || path_name == "/") {
            response.writeHead(404, {"Content-Type":'text/plain'});
            response.write("Path is invalid. Expecting http://ip:port/home");
            response.end();
            return;
        }

        let _path = "";
        for (let i = 0; i < this._static_folders.length; i++) {
            let f = this._static_folders[i];
            let pt = f + "/" + path_name;
            if (true == fs.existsSync(pt)) {
                _path = pt;
                break;
            }
        }

        helper.log("["+this._name+":handleStatic] _path:", _path);

        httpfile.getInst().emit("http.file.event", request, response, _path);
    }
}

module.exports = httpstatic;