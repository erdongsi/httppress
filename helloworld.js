// 简单计算
const path = require("path");
const fs = require("fs");

const httpmod = require("./src/httpmod");

const helper = require("./utils/helper");

class helloworld extends httpmod {

    static getInst() {
        if (helper.isNullOrUndefined(helloworld.inst)) {
            helloworld.inst = new helloworld('helloworld');
        }
        return helloworld.inst;
    }
    constructor(name) {
        super(name);
        this._file_caches = {};
    }
    initEvents() {
        // m = {tick, query}
        this.on('message', (m) => {
            helper.logYellow("["+this._name+"]", process.pid, "get messsage:", m);

            console.time(""+this._name+".process.message."+m.tick);

            let sq = JSON.stringify(m);

            m.result = 'ok';
            m.data = {};
            m.data.code = 200;
            m.data.header = {"Content-Type":"text/plain"+";charset=utf-8"};
            m.data.contents = "Helloworld! I got quest:"+sq;

            helper.log("["+this._name+"] process done:", process.pid);

            setTimeout(()=>{
                this.doMsg(m);
            },0);
        });
    }
}

module.exports = helloworld;
