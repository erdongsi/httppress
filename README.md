# cwchttp
A simple http framework.

# How to code?
Key codes of example_httppress.js:

    const httprouter = require("./src/httprouter");
    const httpserver = require("./src/httpserver");

    // 1.create & init http routers.
    let _http_router = new httprouter();

    _http_router.on('/helloworld', (args)=>{ helloworld.getInst().handle(args); });

    // 2.create http web server.
    let _ip = helper.getLocalIpv4Address();
    let _port = 80;

    let _http_server = new httpserver();
    _http_server.createHttp(_ip, _port, _http_router);

Key codes of helloworld.js:

    this.on('message', (m) => {
        let sq = JSON.stringify(m);

        m.result = 'ok';
        m.data = {};
        m.data.code = 200;
        m.data.header = {"Content-Type":"text/plain"+";charset=utf-8"};
        m.data.contents = "Helloworld! I got quest:"+sq;

        setTimeout(()=>{
            this.doMsg(m);
        },0);
    });


# How to run it?
Install node.js first.
windows>node example_cwchttp.js
linux>nohup node example_cwchttp.js </dev/null >/dev/null 2>err.error &

1, Open web browser, locate 'localhost/helloworld'
2, Open web browser, locate 'localhost/helloworld.png'


