const falafel        = require("falafel");
const beautifier     = require("js-beautify");
const fs             = require("fs");
const vm             = require("vm");

function Runtime () {
    this.expansions = [];
    this.events     = [];
    this.eval_callsites = [];
};

Runtime.prototype.load = function (filepath) {

    const code = fs.readFileSync(filepath).toString();
    this.expansions.push(code);
};

Runtime.prototype.capture_event = function (event) {
    if (this.capture_events) {
        this.events.push(event);
    }
};

Runtime.prototype.create_runtime_sandbox = function (code) {

    var self = this;

    function start () {
        self.capturing = true;
    }

    function stop () {
        self.capturing = false;
    }

    const sandbox_context = {
        stop: stop,
        start: start,
        console: console,
        eval: function (dynamic_code) {

            const StackTrace = require("stack-trace");
            var trace  = StackTrace.get()[1],
                column = trace.getColumnNumber() - 1,
                line   = trace.getLineNumber();

            let callsite = `${line},${column}`;

            if (!self.eval_callsites.includes(callsite)) {
                console.log("new callsite:", callsite);
            }

            // Walk the SRC until we find the call site of this eval
            // call.
            var expanded_code = falafel(code, { locations: true }, function (node) {

                if (node.type === "CallExpression") {

                    let node_line = node.loc.start.line,
                        node_col  = node.loc.start.column;

                    if (node_line === line && node_col === column) {
                        console.log("GOT CALLSITE AT LINE", line, "COL", column);
                        const eval_arg = node.arguments[0].source();
                        node.arguments[0].update(`CAPTURE(${eval_arg})`);
                        console.log(node.source());

                        // TODO: find a way to exit the VM here.
                        process.exit();
                    }
                }
            });

            self.expansions.push(expanded_code);
        }
    };

    vm.createContext(sandbox_context);
    return function () {
        vm.runInContext(code, sandbox_context);
    };
};


Runtime.prototype.run = function () {

    console.log("--[ RUNNING ]--");

    for (let i = 0; i < this.expansions.length; i++) {
        const sandbox = this.create_runtime_sandbox(this.expansions[i]);
        sandbox();
        console.log(`--- expansion[${i}] ---`);
        console.log(this.expansions[i]);
        console.log();
    }
};

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////
let rt = new Runtime();
rt.load(process.argv[2]);
rt.run();

console.log(rt.events);
