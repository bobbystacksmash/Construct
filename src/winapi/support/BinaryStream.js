const Stream     = require("./Stream");
const TextStream = require("./TextStream");

class BinaryStream extends Stream {

    constructor (context) {

        super(context);

        this.pos            = 0;
        this.stream_is_open = false;
    }

    set charset (_) {
        throw new Error("Cannot set '.charset' property on a Binary Stream.");
    }

    get type () {
        return 1;
    }

    fetch_n_bytes (n_bytes) {
        return this._fetch_n_bytes(n_bytes);
    }

    fetch_all () {
        return this._fetch_all();
    }

    put (data) {

        if (!this.stream_is_open) {
            throw new Error("Stream is not open for writing.");
        }

        this.put_buf(data);
    }

    copy_to (dest_stream, num_bytes) {

        if (dest_stream.constructor.name === "TextStream") {
            throw new Error("Cannot copy from a BinaryStream in to a TextStream");
        }

        var stream_contents;

        if (num_bytes === undefined || num_bytes === null || num_bytes === -1) {
            stream_contents = this.fetch_all();
        }
        else {
            stream_contents = this.fetch_n_bytes(num_bytes);
        }

        dest_stream.put(stream_contents);
    }

    load_from_file (path) {

        let file_contents = this._load_from_file(path);
        this.buffer   = Buffer.from(file_contents);
        this.position = 0;
    }

    to_text_stream () {

        let ts = new TextStream(this.context);

        ts.open();
        ts.put(this.buffer);
        ts.position = this.pos;

        if (!this.stream_is_open) {
            ts.close();
        }

        return ts;
    }
}

module.exports = BinaryStream;
