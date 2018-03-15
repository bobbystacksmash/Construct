const proxify   = require("../proxify2");
const Component = require("../Component");
const urlparser = require("../url-parser");

class XMLHttpRequestBase extends Component {

    constructor (context, tag) {

	super(context, tag);

	console.log("NEW XMLTTHPREQUEST BASE");

	this.ee  = this.context.emitter;
	this.tag = tag;
	this.event_id = `@${tag}`;

	this.route = null;
	this.request = {
	    method: "GET",
	    headers: []
	};
	
    }

    _lookup_route (method, uri) {
	this.route = this.context.get_route(method, uri);
	this.request.method = method;
    }


    get status () {
	this.ee.emit(`${this.event_id}.status`, this.route.status);
	return this.route.status;
    }


    get responsebody () {
	console.log(`${this.event_id}.responsebody`, this.route.response_body);
	this.ee.emit(`${this.event_id}.responsebody`, this.route.response_body);	
    }

    
    get responsetext () {
	console.log(`${this.event_id}.responsetext`, this.route.response_body);
	this.ee.emit(`${this.event_id}.responsetext`, this.route.response_body);
	return this.route.response_body;
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
    setrequestheade (header, val) {
	this.ee.emit(`${this.event_id}::SetRequestHeader`, { header: header, value: val });
	this.request.headers.push(`${header}: ${val}`);
    }
    

    open (method, url, asyn, user, password) {

	console.log(`XHR.Open(${method}, ${url})`);

	this._lookup_route(method, url);

	let parsed_url   = urlparser(url),
	    emitter_args = {
		args: {
		    method: method,
		    url: url,
		    asyn: asyn,
		    user: user,
		    password: password
		}
	    };


	emitter_args = Object.assign(parsed_url, emitter_args);

	this.ee.emit(`${this.event_id}::Open`, emitter_args);
    }


    send () {

	this.ee.emit(`${this.event_id}::Send`, this.request);
	
	let headers = this.request.headers.map((h) => `-H '${h}'`).join(" ");
	let parts_of_cmd = [
	    `curl`,
	    `--request ${this.request.method}`,
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
}

