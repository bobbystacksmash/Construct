var fso = new ActiveXObject("Scripting.FileSystemObject");

try {
	fso.CreateFolder("c:\\fso-dir");	
}
catch (e) {
	WScript.Echo("#CreateFolder failed: " + e.message);
	// > #CreateFolder failed: File already exists
}