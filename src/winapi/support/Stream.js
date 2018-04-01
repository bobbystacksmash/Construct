class Stream {

    constructor () {

        this.buffer = null;
        this.pos    = 0;
        this.stream_is_open = false;
    }

    get EOS () {
        if (!this.buffer) return false;
        if (this.buffer.byteLength === this.pos) return true;
        return false;
    }

    set position (p) {

        if (p === 0) {
            this.pos = 0;
            return;
        }
        else if (! this.buffer || this.buffer === null || this.buffer === undefined) {
            throw new Error("Cannot set position to a positive value " +
                            "while the buffer is empty.");
        }

        if (p > this.buffer.byteLength) {
            throw new Error("Position cannot be set to " +
                            "an index beyond the bounds of "+
                            "the internal buffer.");
        }

        this.pos = p;
    }
    get position () {

        if (!this.stream_is_open) {
            throw new Error("Position cannot be called when stream instance is closed.");
        }

        return this.pos;
    }
    get size () {

        if (!this.stream_is_open) {
            throw new Error("Size cannot be called when stream instance is closed.");
        }

        if (this.buffer === null ||  this.buffer.length === 0) return 0;

        return Buffer.byteLength(this.buffer, "utf16le");
    }

    open () {
        this.stream_is_open = true;
    }

    close () {
        this.stream_is_open = false;
    }


    _fetch_all () {

        if (! this.buffer || this.buffer.byteLength === 0) {
            return "";
        }

        let num_bytes_to_read = (this.buffer.byteLength - this.pos),
            outbuf = Buffer.alloc(num_bytes_to_read);
        this.buffer.copy(outbuf, 0, this.pos);
        this.pos = this.buffer.byteLength;
        return outbuf;
    }

    _fetch_n_bytes (num_bytes_to_read) {

        if (! this.buffer || this.buffer === null || this.buffer.byteLength === 0) {
            return "";
        }

        // If the n_chars to read is greater than the length
        // of the available buffer, we just read up to the
        // end of buffer.
        let num_bytes_available = (this.buffer.byteLength - this.pos),
            max_bytes_to_read   = Math.min(num_bytes_to_read, num_bytes_available),
            read_upto_index     = this.pos + num_bytes_to_read;

        if (read_upto_index > this.buffer.byteLength - 1) {
            read_upto_index = (this.buffer.byteLength - 1);
        }

        const outbuf = Buffer.alloc(Math.min(num_bytes_to_read, num_bytes_available));

        this.buffer.copy(outbuf, 0, this.pos, read_upto_index);
        this.pos += 2;
        return outbuf;
    }

}

module.exports = Stream;
