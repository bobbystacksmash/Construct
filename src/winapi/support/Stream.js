

class Stream {

    constructor (context) {

        context = context || { register: () => {} };

        this.context = context;
        this.vfs = context.vfs;

        this.buffer = Buffer.alloc(0);
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
        else if (p < 0) {
            throw new Error("Cannot set position to a negative value.");
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

    set_EOS () {

        if (this.position < 0) {
            throw new Error("Cannot call EOS on a negative position value.");
        }

        let tmpbuf = Buffer.alloc(this.position);
        this.buffer.copy(tmpbuf, 0, 0, this.position);
        this.buffer = tmpbuf;
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
            read_upto_index = (this.buffer.byteLength);
        }

        const outbuf = Buffer.alloc(Math.min(num_bytes_to_read, num_bytes_available));

        this.buffer.copy(outbuf, 0, this.pos, read_upto_index);
        this.pos += max_bytes_to_read;
        return outbuf;
    }

    save_to_file (path, save_opt) {

        if (this.stream_is_open === false) {
            throw new Error("Unable to save to file -- the stream is not open.");
        }

        let fsbuf = Buffer.alloc(this.buffer.byteLength || 0);
        this.buffer.copy(fsbuf, 0);

        this.vfs.AddFile(path, fsbuf);
        this.position = 0;
    }

    _load_from_file (path) {

        if (this.stream_is_open === false) {
            throw new Error("Unable to load from file -- the stream is not open.");
        }

        // Does the file even exist?
        let file = this.vfs.GetFile(path);

        if (! file) {
            throw new Error(`Unable to load file ${path} - this does not exist.`);
        }

        this.position = 0;
        return file.__contents;
    }

}

module.exports = Stream;
