/*
 * https://msdn.microsoft.com/en-us/subscriptions/312a5kbt(v=vs.84).aspx
 *
 * Facilitates sequential access to file.
 *
 * PROPERTIES
 * ==========
 * [ ] - AtEndOfLine   https://msdn.microsoft.com/en-us/subscriptions/kaf6yaft(v=vs.84).aspx
 * [ ] - AtEndOfStream https://msdn.microsoft.com/en-us/subscriptions/ffk3x3bw(v=vs.84).aspx
 * [ ] - Column        https://msdn.microsoft.com/en-us/subscriptions/3tza1eca(v=vs.84).aspx
 * [ ] - Line          https://msdn.microsoft.com/en-us/subscriptions/chsfhd43(v=vs.84).aspx
 *
 *
 * METHODS
 * =======
 * [ ] - Close           https://msdn.microsoft.com/en-us/subscriptions/yb3tbdkw(v=vs.84).aspx
 * [ ] - Read            https://msdn.microsoft.com/en-us/subscriptions/dhyx75w2(v=vs.84).aspx
 * [ ] - ReadAll         https://msdn.microsoft.com/en-us/subscriptions/t58aa4dd(v=vs.84).aspx
 * [ ] - ReadLine        https://msdn.microsoft.com/en-us/subscriptions/h7se9d4f(v=vs.84).aspx
 * [ ] - Skip            https://msdn.microsoft.com/en-us/subscriptions/08xz3c5a(v=vs.84).aspx
 * [ ] - SkipLine        https://msdn.microsoft.com/en-us/subscriptions/zbhhkawe(v=vs.84).aspx
 * [ ] - Write           https://msdn.microsoft.com/en-us/subscriptions/6ee7s9w2(v=vs.84).aspx
 * [ ] - WriteBlankLines https://msdn.microsoft.com/en-us/subscriptions/eysctzwa(v=vs.84).aspx
 * [ ] - WriteLine       https://msdn.microsoft.com/en-us/subscriptions/t5399c99(v=vs.84).aspx
 */

const winevts = require("../events");
const Proxify = require("../proxify");

function mock_MISSING_METHOD (name) {
    let msg = `[WshShell.${name}] - METHOD NOT YET IMPLEMENTED.`;
    alert(msg)
    console.log(msg);
}

function create(opts) {

    ee = opts.emitter || { emit: () => {}, on: () => {} };
    
    let mock_TextStream = {
        Close:           mock_MISSING_METHOD, // TODO
        Read:            mock_MISSING_METHOD, // TODO
        ReadAll:         mock_MISSING_METHOD, // TODO
        ReadLine:        mock_MISSING_METHOD, // TODO
        Skip:            mock_MISSING_METHOD, // TODO
        SkipLine:        mock_MISSING_METHOD, // TODO
        Write:           mock_MISSING_METHOD, // TODO
        WriteBlankLines: mock_MISSING_METHOD, // TODO
        WriteLine:       mock_MISSING_METHOD, // TODO
    };

    let overrides = {};

    var proxify = new Proxify({ emitter: ee });
    return proxify(mock_WshScriptExec, {}, "TextStream");
}

module.exports = create;
