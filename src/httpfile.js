// 可以 和 httpserver 配合使用 创建 web 服务器。

const events = require("events");
const url = require("url");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

const helper = require("../utils/helper");

class httpfile extends events {

    static getInst() {
        if (helper.isNullOrUndefined(httpfile.inst)) {
            httpfile.inst = new httpfile();
        }
        return httpfile.inst;
    }

    constructor() {
        super();

        this._name = "httpfile";

        this.on('http.file.event', (...args)=>{
            let request = args[0]
            let response = args[1];
            let file = args[2];
            this.responseFile(request, response, file);
        });
    }
    responseFile(request, response, file) {
        helper.log("["+this._name+":responseFile](request,response,",file,") >>>>>");

        let _path = file;

        if (false == fs.existsSync(_path)) {
            response.writeHead(404, {"Content-Type":'text/plain'});
            response.write(_path + " is not exist.");
            response.end();
            return;
        }

        let _encoding = "utf-8";
        
        let _ext = path.extname(_path);
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

        const raw = fs.createReadStream(_path);
        raw.on('error', (e_raw)=>{
            helper.logRed("["+this._name+":responseFile] e_raw:", e_raw.message);
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

module.exports = httpfile;