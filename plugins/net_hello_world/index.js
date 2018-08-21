
module.exports = {
    description: "An example plugin.", // Optional
    version:     "0.1.0",              // Optional
    author:      "Unknown",            // Optional
    onload:      onload                // Required.
};

function onload (hook) {

    function response (request) {

        const js_response = `function () { console.log("RESPONSE WAS RUN AS JS");`;

        var response_obj = {
            status: 200,
	    headers: {
		"content-length": js_response.length
	    },
            body: js_response
        };

        return response_obj;
    }

    hook.network("Ping? Pong! Network Handler", "POST", /192\.168\.13\.37/, response);
};
