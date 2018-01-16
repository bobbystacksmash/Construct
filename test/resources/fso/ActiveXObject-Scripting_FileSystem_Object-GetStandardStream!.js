var fso = new ActiveXObject("Scripting.FileSystemObject");

var modes = {
	StdIn:  0,
	StdOut: 1,
	StdErr: 2	
};

for (var key in modes) {
	WScript.Echo("Fetching Stream: " + key);
	var stream = fso.GetStandardStream(modes[key]);
}

// > Fetching StandardStream: StdIn|StdOut|StdErr
// check return type?