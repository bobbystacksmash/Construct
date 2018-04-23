

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

    get can_change_stream_type () {
        return (this.pos === 0);
    }

    get is_open () {
        return this.stream_is_open;
    }

    get is_closed () {
        return this.stream_is_open === false;
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

        return Buffer.byteLength(this.buffer);
    }

    open () {
        this.stream_is_open = true;
    }

    close () {
        this.pos = 0;
        this.stream_is_open = false;
    }

    set_EOS () {

        if (this.position < 0) {
            throw new Error("Cannot call EOS on a negative position value.");
        }

        this.buffer = this.buffer.slice(0, this.position);
        this.pos = this.buffer.byteLength;
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
        this.pos = read_upto_index;

        return outbuf;
    }

    put_buf (buf) {

        // Covers the case where the stream is totally empty -- just
        // set `this.buffer' to contain whatever is in `buf'.
        if (this.buffer.byteLength === 0) {
            this.buffer = buf;
            this.pos = buf.byteLength;
            return;
        }

        // First, let's calculate how wide `this.buffer' is going to
        // be once we've copied `buf' in to it.  Streams support
        // copying new buffers in to them, starting from `this.pos'.
        // If the incoming `buf' is wider than the existing
        // `this.buffer', then `this.buffer' needs to be extended to
        // accomodate the additional bytes.
        //
        let new_this_buf_len = this.pos + buf.byteLength;

        if (new_this_buf_len <= this.buffer.byteLength) {

            // If we get here, then we know that the incoming `buf'
            // will fit exactly in to our existing buffer -- there is
            // no need to resize `this.buffer'.
            buf.copy(this.buffer, this.pos);
            this.pos = this.buffer.byteLength;
            return;
        }

        // We need to lengthen `this.buffer' so we can accomodate the
        // contents of `buf'.  We already know the required width of
        // this buffer (`new_this_buf_len'), so we can alloc this now:
        let new_this_buffer = Buffer.alloc(new_this_buf_len);

        // Our new buffer is now the correct width -- we just need to
        // copy *into* it -- this is done in two stages.  The first
        // stage will copy the contents of `this.buffer', starting at
        // position 0, up to `this.pos' in to the new buffer.  This
        // ensures anything BEFORE `this.pos' exists in the new
        // buffer.  Then we'll copy the entire contents of `buf' in to
        // the new buffer, starting at offset `this.pos'.
        //
        this.buffer.copy(new_this_buffer, 0);
        buf.copy(new_this_buffer, this.pos);

        this.buffer = new_this_buffer;
        this.pos    = new_this_buffer.byteLength;
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
