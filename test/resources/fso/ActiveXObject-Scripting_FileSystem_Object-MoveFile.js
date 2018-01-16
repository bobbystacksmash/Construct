function MoveFile2Desktop(filespec)
{
   var fso;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   try {
     fso.MoveFile(filespec, "c:\\temp\\");	
     return "1";
   }
   catch (e) {
   	return e.message;
   }
   
}


WScript.Echo(MoveFile2Desktop("C:\\fso-dir\\foo.txt"));
// > Path not found
// temp exists > "1"