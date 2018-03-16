const proxify   = require("../proxify2");
const Component = require("../Component");
const urlparser = require("../url-parser");
const hexy      = require("hexy");

class XMLHttpRequestBase extends Component {

    constructor (context, tag) {

	super(context, tag);

	console.log("NEW XMLTTHPREQUEST BASE");

	this.ee  = this.context.emitter;
	this.tag = tag;
	this.event_id = `@${tag}`;

	this.request = {};

	this.route = null;
	this.request = {
	    method: "GET",
	    headers: []
	};
	
    }

    _lookup_route (method, uri) {
	this.route = this.context.get_route(method, uri);
	this.request.method = method;
	this.request.ua     = this.context.user_agent;
	this.setrequestheader("User-Agent", this.request.ua);
    }


    get status () {
	this.ee.emit(`${this.event_id}.status`, this.route.status);
	return this.route.status;
    }


    get responsebody () {

	let response_body = this.response.body;
	
	console.log(`${this.event_id}.responsebody`, response_body);
	this.ee.emit(`${this.event_id}.responsebody`, response_body);

	return response_body;
    }

    
    get responsetext () {

	let response_text = this.response.body;

	console.log(`${this.event_id}.responsetext`, response_text);
	this.ee.emit(`${this.event_id}.responsetext`, response_text);
	
	return response_text;
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
    

    open (method, url, asyn, user, password) {

	console.log(`XHR.Open(${method}, ${url})`);

	this.request.method        = method;
	this.request.address       = url;
	this.request.address_parts = urlparser(url);
	this.request.asyn          = asyn;
	this.request.user          = user;
	this.request.password      = password;
	this.request.sent          = false;

	this.ee.emit(`${this.event_id}::Open`, this.request);
    }


    send (body) {

	if (!body) body = "";
	this.request.body = body;

	console.log("");
	console.log("Post Request Contents");
	console.log(hexy.hexy(body));
	console.log("");

	let nethook = this.context.get_network_hook(
	    this.request.method.toUpperCase(),
	    this.request.address
	);

	let response = nethook.handle(this.request, this.ee);
	this.response = Object.assign({}, this.response, response);

	this.ee.emit(`${this.event_id}::Send`, this.request);
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


    abort () {

    }


    getresponseheader () {

    }


    overridemimeyype () {

    }


    
}

module.exports = function (context, type) {
    let xhr = new XMLHttpRequestBase(context, type);
    return proxify(context, xhr);
};

