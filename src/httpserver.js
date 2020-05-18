// 可以 和 httprouter 配合使用 创建 web 服务器。

const http = require("http");
const https = require("https");
const url = require("url");
const path = require("path");
const fs = require("fs");

const helper = require("../utils/helper");

class httpserver {

    constructor() {
        this.http_ip = null;
        this.http_port = null;
        this.http_router = null;
        this.http_server = null;

        this.https_ip = null;
        this.https_port = null;
        this.https_router = null;
        this.https_server = null;
    }

    createHttp(ip, port, router) {
        //helper.log("[httpserver:createHttp] (", ip+",", port+",", "router) >>>>>");

        if (false == helper.isNullOrUndefined(this.http_server)) {
            helper.logRed("[httpserver:createHttp] http server",this.http_ip,":",this.http_port,"is running. To make new httpserver().");
            return;
        }

        this.http_ip = ip;
        this.http_port = port;
        this.http_router = router;

        this.http_server = http.createServer((request, response)=>{
            this.process(request, response, false);
        });
        this.http_server.on("error", (e)=>{
            helper.logRed("[httpserver:createHttp] error:",e.message);
        });

        this.http_server.listen(port, ip, ()=>{
            helper.logGreen("[httpserver:createHttp] running http server:",ip,":",port);
        });

    }
    createHttps(ip, port, router) {
        helper.log("[httpserver:createHttps] (", ip+",", port+",", "router) >>>>>");

        if (false == helper.isNullOrUndefined(this.https_server)) {
            helper.logRed("[httpserver:createHttps] https server",this.http_ip,":",this.http_port,"is running. To make new httpserver().");
            return;
        }

        this.https_ip = ip;
        this.https_port = port;
        this.https_router = router;

        let _options = {
            key: fs.readFileSync('./ssl/privatekey.pem'),
            cert: fs.readFileSync('./ssl/certificate.pem')
        };

        this.https_server = https.createServer(_options, (request, response)=>{

            this.process(request,response,true);
        });
        this.https_server.on("data", (d)=>{
            helper.logGreen("[httpserver:createHttps] d:", d);
        });
        this.https_server.on("error", (e)=>{
            helper.logRed("[httpserver:createHttps] error:",e.message);
        });

        this.https_server.listen(port, ip, ()=>{
            helper.log("[httpserver:createHttps] running https server:",ip,":",port);
        });
    }
    process(request, response, data, ishttps) {
        //helper.log("[httpserver:process] request:", request);
        helper.logYellow("[httpserver:process] request.url:", request.url);
        //helper.log("[httpserver:process] request[headers]: ", request["headers"]);
        let _req = url.parse(request.url, true, false);
        //helper.log("[httpserver:process] _req.pathname:", _req.pathname);
        //helper.log("[httpserver:process] _req.query:", _req.query);

        let ps = _req.pathname.split('/');
        //helper.log("[httpserver:process] ps:", ps);
        //helper.log("[httpserver:process] ps:", ps.length);

        let evt = '/';
        if (ps.length > 1) {
            evt = '/' + ps[1];
        }

        let the_router = ishttps ? this.https_router : this.http_router;

        let recv_data = Buffer.from('');
        request.on('data', function(chunk) {
            //helper.logGreen("[httpserver:createHttp] chunk:", chunk);
            let b = Buffer.from(chunk);
            recv_data = Buffer.concat([recv_data, b]);
        });
        request.on('end', function() {
            //helper.logGreen("[httpserver:createHttp] recv_data:", recv_data);
            //helper.logGreen("[httpserver:createHttp] recv_data s:", recv_data.toString());
            the_router.emit('http.server.to.router.event', evt, request, response, recv_data, ishttps);
        });
    }
}

module.exports = httpserver;