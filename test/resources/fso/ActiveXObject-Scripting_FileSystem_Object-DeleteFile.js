function DeleteFile(filespec)
{
   var fso;
   fso = new ActiveXObject("Scripting.FileSystemObject");

   try {
   	fso.DeleteFile(filespec);	
   }
   catch (e) {
   	WScript.Echo("#DeleteFile failed: " + e.message);
   	// > #DeleteFile failed: File not found
   }
   
}

DeleteFile("C:\\testfile.txt");