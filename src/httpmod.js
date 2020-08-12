const os = require("os");
const url = require("url");
const zlib = require("zlib");
const events = require("events");

const helper = require("../utils/helper");

const httpfile = require("./httpfile");

class httpmod extends events {

    constructor(name) {
        super();
        this._name = name;
        this._jobs = {};
        this.initEvents();
    }
    initEvents() {
        // virtual
    }
    // do msg from worker
    doMsg (m) {
        let dd = m.data; m.data = "object";
        helper.log("["+this._name+":doMsg] m:", m);
        m.data = dd;

        let _response = this._jobs[m.tick].response;

        let code = m.data.code;
        let header = m.data.header;
        let contents = m.data.contents;
        if (helper.isNullOrUndefined(contents)) {
            contents = "";
        }

        let _request = this._jobs[m.tick].request;
        //helper.log(_request);
        let accept_encoding = _request.headers['accept-encoding'];
        if (helper.isNullOrUndefined(accept_encoding)) {
            accept_encoding = "";
        }
        helper.log("[httpworkmgr:init] accept_encoding:", accept_encoding);

        helper.logYellow("[httpworkmgr:init] contents.length:", contents.length);

        if ('data' == m.result) {
            if (/\bdeflate\b/.test(accept_encoding)) {
                zlib.deflate(contents, (e_deflate,r_deflate)=>{
                    helper.logYellow("r_deflate:", r_deflate);
                    if (e_deflate) {
                        helper.logRed("[httpworkmgr:init] e_deflate:", e_deflate.message);
                        _response.writeHeader(200, {"Content-Type":"text/plain"});
                        _response.write(JSON.stringify({error:e_deflate.message}));
                        _response.end();
                    } else {
                        header["Content-Encoding"] = "deflate";
                        _response.writeHead(code, header);
                        helper.logYellow("[httpworkmgr:init] r_deflate:", r_deflate.length);
                        _response.write(r_deflate);
                        _response.end();
                    }
                    delete this._jobs[m.tick];
                    helper.log("[httpworkmgr:init] delete response by tick:", m.tick);
                });
            } else if (/\bgzip\b/.test(accept_encoding)) {
                zlib.gzip(contents, (e_gzip,r_gzip)=>{
                    helper.logYellow("r_gzip:", r_gzip);
                    if (e_gzip) {
                        helper.logRed("[httpworkmgr:init] e_gzip:", e_gzip.message);
                        _response.writeHeader(200, {"Content-Type":"text/plain"});
                        _response.write(JSON.stringify({error:e_gzip.message}));
                        _response.end();
                    } else {
                        header["Content-Encoding"] = "gzip";
                        _response.writeHead(code, header);
                        helper.logYellow("[httpworkmgr:init] r_gzip:", r_gzip.length);
                        _response.write(r_gzip);
                        _response.end();
                    }

                    delete this._jobs[m.tick];
                    helper.log("[httpworkmgr:init] delete response by tick:", m.tick);
                });
            } else {
                _response.writeHeader(code, header);
                _response.write(contents);
                _response.end();

                delete this._jobs[m.tick];
                helper.log("[httpworkmgr:init] delete response by tick:", m.tick);
            }
        }
        if ('file' == m.result) {
            httpfile.getInst().emit("http.file.event", _request, _response, m.data.contents);
            delete this._jobs[m.tick];
            helper.log("[httpworkmgr:init] delete response by tick:", m.tick);
        }
    }
    handle(args) {
        let _request = args[0];
        let _response = args[1];
        let _recvdata = args[2];
        let _ishttps = args[3];
        //helper.logYellow("_recvdata 1:", _recvdata.toString());

        //helper.logYellow("["+this._name+"] _request:", _request);
        //for (let k in _request) {
        //    helper.log("["+this._name+"]",k,"=");
        //    helper.logYellow(_request[k]);
        //}

        let request_parse = url.parse(_request.url, true, false);
        helper.log("["+this._name+":handle] request_parse:", request_parse);

        let _query = request_parse.query;

        _query.cookies = {};
        if (false == helper.isNullOrUndefined(_request.headers.cookie)) {
            _request.headers.cookie.split(';').forEach((f)=>{
                let kv = f.trim().split('=');
                if (kv.length >= 2) {
                    let k = kv[0].trim();
                    let v = kv[1].trim();
                    _query.cookies[k] = v;
                }
            });
        }

        // make a unique tick for query & response.
        let tick = helper.randomNum(0,10000) + "." + (new Date()).getTime() + "." + helper.randomNum(0,10000);
        this._jobs[tick] = {request:_request, response:_response};
        //helper.log("[httpworkmgr:handle] tick:", tick);

        // send msg to worker.
        let msg = {tick, query:_query, recvdata:_recvdata};
        setTimeout(()=>{
            this.emit('message', msg);
        }, 0);
    }
}

module.exports = httpmod;