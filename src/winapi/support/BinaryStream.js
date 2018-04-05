
const Stream = require("./Stream");

class BinaryStream extends Stream {

    constructor (context) {

        super(context);

        this.pos            = 0;
        this.stream_is_open = false;
    }

    set charset (_) {
        throw new Error("Cannot set '.charset' property on a Binary Stream.");
    }

    put () {
        throw new Error("Cannot write directly in to a binary stream. Use 'load_from_file' instead.");
    }

    open () {
        this.stream_is_open = true;
    }

    close () {
        this.stream_is_open = false;
    }

    fetch_n_bytes (n_bytes) {
        return this._fetch_n_bytes(n_bytes);
    }

    fetch_all () {
        return this._fetch_all();
    }

    load_from_file (path) {

        let file_contents = this._load_from_file(path);
        this.buffer   = Buffer.from(file_contents);
        this.position = 0;
    }
}

module.exports = BinaryStream;
