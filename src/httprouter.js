// 可以 和 httpserver 配合使用 创建 web 服务器。

const events = require("events");
const url = require("url");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

const helper = require("../utils/helper");

class httprouter extends events {
    constructor() {
        super();

        this.routers = {};

        this.on('http.server.to.router.event', (...args)=>{
            //helper.log("[httprouter:constructor] args[0]:", args[0]);
            //helper.log("[httprouter:constructor] args:", args);
            //helper.log("args.slice(1):", args.slice(1).length);
            if (this.eventIndex(args[0]) >= 0) {
                this.emit(args[0], args.slice(1));
            } else {
                this.handleStatic(args.slice(1));
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
    handleStatic(args) {
        helper.log("[httprouter:handleStatic] (args) >>>>>");
        //helper.log("[httprouter:handleStatic] args[0]:", args[0]);
        //helper.log("[httprouter:handleStatic] args[1]:", args[1]);
        //helper.log("[httprouter:handleStatic] args[2]:", args[2]);
        //helper.log("[httprouter:handleStatic] args[3]:", args[3]);
        let request = args[0];
        let response = args[1];
        let recv_data = args[2];
        let ishttps = args[3];
        //let ss = args[3];
        //let b = dd[4];
        //helper.log("[httprouter:handleStatic] (request, response, ishttps["+ishttps+"]) >>>>>");
        //helper.logYellow("[httprouter:handleStatic] request:", request);
        //helper.logGreen("[httprouter:handleStatic] response:", response);
        //helper.log("[httprouter:handleStatic] ishttps:", ishttps);

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
        helper.log("[httprouter:handleStatic] path_name:", path_name);

        if (path_name.length <= 0 || path_name == "/") {
            response.writeHead(404, {"Content-Type":'text/plain'});
            response.write("Path is invalid. Expecting http://ip:port/home");
            response.end();
            return;
        }

        let _path = path.resolve(__dirname, "../public/"+path_name);
        helper.log("[httprouter:handleStatic] _path:", _path);

        let _encoding = "utf-8";
        
        let _ext = path.extname(path_name);
        if (_ext.length <= 0) {
            _ext = ".html";
        }

        let c_type = "text/"+_ext.replace(".", "");

        if (".fax" == _ext
            || ".gif" == _ext
            || ".png" == _ext) {
            c_type = "image/" + _ext.replace(".", "");
            _encoding = "binary";
        } else if (".tiff" == _ext
            || ".tif" == _ext) {
            c_type = "image/tiff";
            _encoding = "binary";
        } else if(".ico" == _ext) {
            c_type = "image/x-icon";
            _encoding = "binary";
        } else if(".jfif" == _ext
            || ".jpe" == _ext
            || ".jpeg" == _ext
            || ".jpg" == _ext) {
            c_type = "image/jpeg";
            _encoding = "binary";
        } else if(".net" == _ext) {
            c_type = "image/pnetvue";
            _encoding = "binary";
        } else if(".rp" == _ext) {
            c_type = "image/vnd.m-realpix";
            _encoding = "binary";
        } else if(".wbmp" == _ext) {
            c_type = "image/vnd.wap.wbmp";
            _encoding = "binary";
        }

        if (false == fs.existsSync(_path)) {
            response.writeHead(404, {"Content-Type":'text/plain'});
            response.write(_path + " is not exist.");
            response.end();
        } else {
            const raw = fs.createReadStream(_path);
            raw.on('error', (e_raw)=>{
                helper.logRed("[httprouter:handleStatic] e_raw:", e_raw.message);
            });
            if (helper.isNullOrUndefined(raw)) {
                response.writeHead(404, {"Content-Type":'text/plain'});
                response.write("createReadStream("+_path + ") return null.");
                response.end();
            } else {
                let accept_encoding = "";
                if (false == helper.isNullOrUndefined(request.headers)) {
                    accept_encoding = request.headers["accept-encoding"];
                    if (helper.isNullOrUndefined(accept_encoding)) {
                        accept_encoding = "";
                    }
                }
                let j_header = {"Content-Type":c_type+ ("utf-8"==_encoding ? ";charset=utf-8" : "")};
                if (/\bdeflate\b/.test(accept_encoding)) {
                    j_header["Content-Encoding"] = "deflate";
                    response.writeHead(200, j_header);
                    raw.pipe(zlib.createDeflate()).pipe(response);
                } else if (/\bgzip\b/.test(accept_encoding)) {
                    j_header["Content-Encoding"] = "gzip";
                    response.writeHead(200, j_header);
                    raw.pipe(zlib.createGzip()).pipe(response);
                } else {
                    response.writeHead(200, j_header);
                    raw.pipe(response);
                }
            }
        }
    }
}

module.exports = httprouter;