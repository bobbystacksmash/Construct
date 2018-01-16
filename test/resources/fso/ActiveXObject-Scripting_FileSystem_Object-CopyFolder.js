var fso = new ActiveXObject("Scripting.FileSystemObject");
try {
	fso.CopyFolder ("c:\\fso-dir\\*", "c:\\tempfolder\\")
}
catch (e) {
	WScript.Echo("#CopyFolder failed: " + e.message);
	// > #CopyFolder failed: Path not found
}