
var fso = new ActiveXObject("Scripting.FileSystemObject");

try {
	fso.CopyFile ("c:\\fso-test\\*.txt", "c:\\tempfolder\\");	
}
catch (e) {
	WScript.Echo("#CopyFile failed: " + e.message);
	// > #CopyFile failed: Path not found
}