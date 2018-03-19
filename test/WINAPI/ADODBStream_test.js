const assert = require("chai").assert;
const JS_ADODBStream = require("../../src/winapi/ADODBStream");

let mock_context = {
    epoch: 123456,
    emitter: {
	on: () => {},
	emit: () => {}
    }
};

describe("ADODBStream", () => {

    xdescribe("#Open", () => {

	it("Should open a new Stream when Open is called.", (done) => {

	    let context = Object.assign({}, mock_context, {
		emitter: {
		    emit: (event) => {
			if (event === "@ADODBStream::Open") {
			    assert.equal(true, true);
			    done();
			}
		    }
		}
	    });

	    let stream = new JS_ADODBStream(context);
	    stream.open();
	});

	it("Should throw an exception when Open is called on an already open obj.", (done) => {

	    let context = Object.assign({}, mock_context, {
		exceptions: {
		    throw_not_allowed: (source) => {
			throw new Error("msg");
		    }
		}
	    });
	    
	    let stream = new JS_ADODBStream(context);
	    assert.doesNotThrow(stream.open);
	    assert.throws(stream.open, Error);
	    done();
	});
    });


    xdescribe("#Write", () => {

	it("Should allow bytes to be written to the stream.", (done) => {

	    let stream = new JS_ADODBStream(mock_context);
	    stream.open();
	    stream.write([ 0xBA, 0xAD, 0xC0, 0xFF, 0xEE ]);
	    assert.equal(stream.size, 5);
	    done();
	});


	it("Should allow more bytes to be written to an existing buffer.", (done) => {

	    let stream = new JS_ADODBStream(mock_context);
	    stream.open();
	    stream.write([ 0xBA, 0xAD, 0xC0, 0xFF, 0xEE ]);
	    stream.write([ 0xDE, 0xAD, 0xBE, 0xEF       ]);

	    assert.equal(stream.size, 9);
	    assert.deepEqual(stream.read(stream.size), [
		0xBA, 0xAD, 0xC0, 0xFF, 0xEE,
		0xDE, 0xAD, 0xBE, 0xEF
	    ]);

	    done();
	});
    });

    
    describe("ADODBStream.position", () => {

	describe("GET", () => {
	});

	describe("SET", () => {

	    it("Should increase the size of the buffer if position is longer than buf.len", (done) => {

		let stream = new JS_ADODBStream(mock_context);
		stream.open();
		stream.write([ 0xBA, 0xAD, 0xC0, 0xFF, 0xEE ]);
		assert.equal(stream.size, 5);

		stream.position = 10;
		assert.equal(stream.size, 10);
		assert.equal(stream.position, 10);

		assert.deepEqual(stream.read(), [0xBA, 0xAD, 0xC0, 0xFF, 0xEE, 0, 0, 0, 0, 0]);

		done();
	    });
	});
    });


    describe("#CopyTo", () => {

	it("Should copy bytes from one stream to another.", (done) => {

	    let stream_one = new JS_ADODBStream(mock_context),
		stream_two = new JS_ADODBStream(mock_context);

	    stream_one.open();
	    stream_two.open();

	    stream_one.write([ 0xDE, 0xAD, 0xBE, 0xEF ]);
	    stream_two.write([ 0x0F, 0xF1, 0xCE       ]);

	    stream_one.copyto(stream_two);

	    assert.deepEqual(stream_two.read(), [ 0x0F, 0xF1, 0xCE, 0xDE, 0xAD, 0xBE, 0xEF ]);
	    done();
	    
	});
	
    });

    describe("#SetEOS", () => {

	it("Should lose all data AFTER EOS once set.", (done) => {
 
	    let stream = new JS_ADODBStream(mock_context);
	    stream.open();
	    stream.write([ 0xBA, 0xAD, 0xC0, 0xFF, 0xEE ]);
	    assert.equal(stream.size, 5);

	    stream.setEOS(3);
	    
	    assert.deepEqual(stream.read(stream.size), [0xBA, 0xAD, 0xC0]);
	    assert.equal(stream.size, 3);

	    done();
	});
	

	it("Should truncate as expected.", (done) => {
	    
	    let stream = new JS_ADODBStream(mock_context);
	    stream.open();
	    stream.write([ 0xBA, 0xAD, 0xC0, 0xFF, 0xEE ]);
	    assert.equal(stream.size, 5);

	    stream.setEOS(2);
	    
	    stream.write([ 0xBE, 0xEF  ]);

	    assert.equal(stream.size, 4);
	    assert.deepEqual(stream.read(stream.size), [
		0xBA, 0xAD, 0xBE, 0xEF
	    ]);

	    done();
	});
    });

});


