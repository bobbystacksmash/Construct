// https://msdn.microsoft.com/en-us/library/zst29hfc(v=vs.84).aspx
function AddNewFolder(path,folderName)
{
   var fso, f, fc, nf;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   f = fso.GetFolder(path);
   fc = f.SubFolders;

   WScript.Echo("Trying to create folder: " + folderName);

   try {
   	nf = fc.Add(folderName);
    WScript.Echo("Successfully created folder: " + folderName);
   }
   catch (e) {
   	WScript.Echo("Failed to create folder: " + folderName);
   	WScript.Echo(e.message);
   }

   
   
}

AddNewFolder("C:\\", "fso-test");

// First run (when 'fso-test' dir does not exist):
//
// > Trying to create folder: fso-test
// > Successfully created folder: fso-test
//
// Second run:
//
// > Trying to create folder: fso-test
// > Failed to create foldeR: fso-test
// > File already exists (e.message prop)