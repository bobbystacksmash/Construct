function ShowFileName(filespec){
   var fso;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   try {
   	return fso.GetFileVersion(filespec);
   }
   catch (e) {
   	return e.message
   }
   
}

WScript.Echo(ShowFileName("C:\\x\\x.txt"))
// > ""