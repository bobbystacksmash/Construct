// "txt"

function GetAnExtension(DriveSpec) {
	var fso = new ActiveXObject("Scripting.FileSystemObject"),
		ext = fso.GetExtensionName(DriveSpec);

	return ext;
}

WScript.Echo(GetAnExtension("C:\\abc"));
// > txt
// unknown ext > ""