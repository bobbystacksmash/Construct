const proxify    = require("../proxify2");
const Component  = require("../Component");
const urlparser  = require("../url-parser");
const HTTPStatus = require("http-status");

class XMLHttpRequestBase extends Component {

    constructor (context, tag) {

	super(context, tag);

	this.ee  = this.context.emitter;
	this.tag = tag;
	this.event_id = `@${tag}`;

        this.__name__ = "XMLHttpRequest";

	this.request  = {};
	this.response = {};

	this.ready_state_change_handler = () => {};
	this.ready_state_num = 0;

	this.route = null;
	this.request = {
	    method: "GET",
	    headers: []
	};
    }

    //
    // Utility Methods
    // ===============
    //
    _lookup_route (method, uri) {
	this.route          = this.context.get_route(method, uri);
	this.request.method = method;
	this.request.ua     = this.context.user_agent;
	this.setrequestheader("User-Agent", this.request.ua);
    }

    _set_ready_state (num) {
	this.ready_state_num = num;
	this.ready_state_change_handler.call(this);
    }


    _response_body (type) {
	return (this.response.body) ? this.response.body : null;
    }


    _make_curl_request () {

	let data = `''`;
	if (/^POST$/i.test(this.request.method)) {
	    data = JSON.stringify(this.request.body);
	}

	let headers = this.request.headers.map((h) => `-H '${h}'`).join(" ");
	let parts_of_cmd = [
	    `curl`,
	    `--request ${this.request.method}`,
	    `--data ${data}`,
	    headers,
	    this.route.uri
	];

	let cmd_actual = parts_of_cmd.join(" ");
	this.ee.emit("-curl", cmd_actual);
    }


    //
    // E V E N T   H A N D L E R S
    //  * * * * * * * * * * * * *
    //

    // MSDN: https://msdn.microsoft.com/en-us/expression/dd576252(v=vs.71)
    //
    // `onreadystatechange'
    // ====================
    //
    // An EventHandler that is called whenever the readyState
    // attribute changes.
    //
    set onreadystatechange (fn) {
	this.ee.emit(`${this.event_id}.onreadystatechange`, fn);
	this.ready_state_change_handler = fn.bind(this);
    }


    // MSDN: https://msdn.microsoft.com/en-us/expression/cc197061(v=vs.71)
    //
    // `ontimeout'
    // ===========
    //
    // Raised when there is an error that prevents completion of the
    // request.
    //
    set ontimeout (fn) {
	this.ee.emit(`${this.event_id}.ontimeout`, fn);
	fn.call(this);
    }


    // MSDN: https://msdn.microsoft.com/en-us/expression/cc304105(v=vs.71)
    //
    // `timeout'
    // =========
    //
    // Gets or sets the time-out value.
    //
    // TODO: Need to update construct so that plugins can decide
    // whether or not they "timeout".
    set timeout (timeout_ms) {

	this.ee.emit(`${this.event_id}.timeout`, timeout_ms);

	// TODO: add something here so that we can communicate with a
	// nethook to invoke a timeout.
    }

    // MSDN: https://msdn.microsoft.com/en-us/expression/hh872883(v=vs.71)
    //
    // `withCredentials'
    // =================
    //
    // Indicates whether user credentials should be included with the
    // request.
    //
    set withcredentials (yes_no) {
	this.ee.emit(`${this.event_id}.withCredentials`, yes_no);
    }


    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType
    //
    // `responseType'
    // ==============
    //
    // The XMLHttpRequest property responseType is an enumerated string
    // value specifying the type of data contained in the response.
    //
    set responseType (type) {
	this.ee.emit(`${this.event_id}.responseType`, type);
    }

    //
    // G E T T E R S
    //  * * * * * *
    //

    // MSDN: https://msdn.microsoft.com/en-us/expression/ms534361(v=vs.71)
    //
    // `readyState'
    // ============
    //
    // Returns a number, the state of the request.
    //
    // | Value | State            | Description                                                     |
    // |-------|------------------|-----------------------------------------------------------------|
    // | 0     | UNSENT           | Client has been created; `open()' not called yet.               |
    // | 1     | OPENED           | `open()' has been called.                                       |
    // | 2     | HEADERS_RECEIVED | `send()' has been called, and headers and status are available. |
    // | 3     | LOADING          | Downloading; `responseText' holds partial data.                 |
    // | 4     | DONE             | The operation is complete.                                      |
    //
    get readystate () {
	this.ee.emit(`${this.event_id}.readystate`, this.ready_state_num);
	return this.ready_state_num;
    }


    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
    //
    // `responseText'
    // ==============
    //
    // Returns a string that contains the response to the request as
    // text, or null if the request was unsuccessful or has not yet
    // been sent.
    //
    get responsetext () {
	// Event is emitted from `_response_body'.
	return Buffer.from(this._response_body("responsetext"));
    }
    get responsebody () {
	// Event is emitted from `_response_body'.
	return Buffer.from(this._response_body("responsebody"));
    }


    // MSDN: https://msdn.microsoft.com/en-us/expression/ms534370(v=vs.71)
    //
    // `responseXML'
    // =============
    //
    // Retrieves the response body as an XML DOM object.
    //
    get responsexml () {
	// TODO: This isn't implemented.
	this.ee.emit(`${this.event_id}.responseXML`, "NOT IMPLEMENTED");
    }


    // MSDN: https://msdn.microsoft.com/en-us/expression/ms534650(v=vs.71)
    //
    // `status'
    // ========
    //
    // Retrieves the HTTP status code of the request.
    //
    get status () {
	this.ee.emit(`${this.event_id}.status`, this.response.status);
	return this.response.status;
    }


    // MSDN: https://msdn.microsoft.com/en-us/expression/ms534647(v=vs.71)
    //
    // `statusText'
    // ============
    //
    // Retrieves the friendly HTTP status of the request.
    //
    get statustext () {
	let friendly_status = HTTPStatus[this.response.status];
	this.ee.emit(`${this.event_id}.statusText`, friendly_status);
	return friendly_status;
    }


    //
    // M E T H O D S
    //  * * * * * *
    //

    // MSDN: https://msdn.microsoft.com/en-us/expression/ms535874(v=vs.71)
    //
    // `abort'
    // =======
    //
    // Cancels the current HTTP request.
    //
    abort () {
	this.ee.emit(`${this.event_id}::Abort`, this.request);
    }


    // MSDN: https://msdn.microsoft.com/en-us/expression/ms536428(v=vs.71)
    //
    // `getAllResponseHeaders'
    // =======================
    //
    // Returns the complete list of response headers.
    //
    getallresponseheaders () {

	let res_headers = this.response.headers,
	    all_response_headers = Object
		.keys(res_headers || {})
		.map((hdr) => `${hdr}: ${res_headers[hdr]}`)
		.join(`\r\n`);

	this.ee.emit(`${this.event_id}.GetAllResponseHeaders()`, all_response_headers);
	return all_response_headers;
    }


    // MSDN: https://msdn.microsoft.com/en-us/expression/ms536442(v=vs.71)
    //
    // `getResponseHeader'
    // ===================
    //
    // Returns the specified response header.
    //
    getresponseheader (header) {

	if (header === undefined || header === null || ! header) {
	    // Microsoft JScript runtime error: Wrong number of arguments or invalid property assignment
	    this.context.exceptions.throw_wrong_argc_or_invalid_prop_assign(
		this.tag,
		`xhr.GetResponseHeader() was called with an undefined 'header' argument.`,
		`When calling 'xhr.GetResponseHeader()', calling code is expected to pass `         +
		    `a header to lookup.  For example: 'xhr.GetResponseHeader("Content-Length")', ` +
		    `however, code in this instance has passed a falsy value, resulting in this `   +
		    `exception being thrown.  You can learn more about the XMLHttpRequest object `  +
		    `here: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getResponseHeader.`
	    );

	    this.ee.emit(`${this.event_id}.GetResponseHeader(${header})`, arguments);
	}

	var header_value = "";

	if (this.response.headers.hasOwnProperty(header.toLowerCase())) {
	    header_value = this.response.headers[header.toLowerCase()];
	}

	this.ee.emit(`${this.event_id}.GetResponseHeader(${header}) -> ${header_value}`, header_value);
	return header_value;
    }


    // MSDN: https://msdn.microsoft.com/en-us/expression/ms536648(v=vs.71)
    //
    // `Open'
    // ======
    //
    // Requests a synchronous or asynchronous file download from a specific URL.
    //
    open (method, url, asyn, user, password) {

	this.request.method        = method;
	this.request.address       = url;
	this.request.address_parts = urlparser(url);
	this.request.asyn          = asyn;
	this.request.user          = user;
	this.request.password      = password;
	this.request.sent          = false;

	this.ee.emit(`${this.event_id}::Open`, this.request);

	this._set_ready_state(1);
    }


    // MSDN: https://msdn.microsoft.com/en-us/expression/dn448456(v=vs.71)
    //
    // `overrideMimeType'
    // ==================
    //
    // Sets the Content-Type header for the response to the MIME provided.
    //
    overridemimetype (mime) {
	this.request.headers["Content-Type"] = mime;
	this.ee.emit(`${this.event_id}::overrideMimeType`, mime);
    }


    // MSDN: https://msdn.microsoft.com/en-us/expression/ms536736(v=vs.71)
    //
    // `send'
    // ======
    //
    // Sends an HTTP request to the server and receives a response.
    //
    send (body) {

	if (!body) body = null;
	this.request.body = body;

	let nethook = this.context.get_network_hook(
	    this.request.method.toUpperCase(),
	    this.request.address
	);

	let response  = nethook.handle(this.request, this.ee);
	this.response = Object.assign(this.response, response);

        this.ee.emit(`${this.__name__}.send`, {
            target: this.__name__,
            type: "internal",
            prop: "send",
            args: [body],
            data: {
                request:  this.request,
                response: response
            }
        });

	this._set_ready_state(2);
	this._set_ready_state(3);
	this._set_ready_state(4);
    }


    //
    // SetRequestHeader
    // ================
    //
    // MSDN: https://msdn.microsoft.com/en-us/library/ms766589(v=vs.85).aspx
    //
    // SYNOPSIS
    // ========
    //
    // Specifies the name of an HTTP header.
    //
    // USAGE
    // =====
    //
    //   var xhr = new ActiveXObject(""Msxml2.XMLHTTP.6.0");
    //   xhr.setRequestHeader("User-Agent", "MyUA" );
    //
    setrequestheader (header, val) {

	this.ee.emit(`${this.event_id}::SetRequestHeader`, { header: header, value: val });

	// Does the current set of request headers contain this one?
	let existing_hdr_idx = this.request.headers.findIndex(
	    h => h.toLowerCase().startsWith(header.toLowerCase())
	);

	let hdr = `${header}: ${val}`;

	if (existing_hdr_idx > -1) {
	    this.ee.emit(`${this.event_id}::SetRequestHeader!hdr_overwritten`, {
		old: this.request.headers[existing_hdr_idx],
		new: hdr,
		idx: existing_hdr_idx,
		headers_old: this.request.headers
	    });
	    this.request.headers[existing_hdr_idx] = hdr;
	}
	else {
	    this.request.headers.push(`${header}: ${val}`);
	}
    }
}

module.exports = function (context, type) {
    let xhr = new XMLHttpRequestBase(context, type);
    return proxify(context, xhr);
};
