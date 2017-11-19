
/*
 * ============
 * ADODB Stream
 * ============
 */
var mock_ADODB_Stream = {

    Open: () => { },

    Type: 0,
    Position: 0,

    Write: (data) => {
        console.log(`[ADODB.Stream] Write() :: "${data}"`);
    },

    SaveToFile: (path) => {
        console.log(`[ADODB.Stream] SaveToFile() :: "${path}"`);
    },

    Close: () => {
        console.log(`[ADODB.Stream] Close()`);
    }
};

var ADODBStreamProxy = new Proxy(mock_ADODB_Stream, {

    get (target, key, trap) {
        console.info(`[FSO] GET ${key}...`);
        return target[key];
    },

    set (target, key, value) {
        console.info(`SET on "${key}" with "${value}"`);
        return true;
    }

});


module.exports = ADODBStreamProxy;
