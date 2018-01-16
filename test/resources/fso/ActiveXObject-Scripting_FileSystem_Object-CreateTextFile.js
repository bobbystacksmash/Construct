var fso = new ActiveXObject("Scripting.FileSystemObject");

try {
	fso.CreateTextFile("c:\\testfile.txt", false);
	a.WriteLine("This is a test.");
	a.Close();
} 
catch (e) {
	WScript.Echo("#CreateTextFile failed: " + e.message);
	// > #CreateTextFile failed: File already exists
}