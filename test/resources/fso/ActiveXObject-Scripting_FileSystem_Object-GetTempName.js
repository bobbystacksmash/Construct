var fso, tempfile;
fso = new ActiveXObject("Scripting.FileSystemObject");

function CreateTempFile()
{
   var tfolder, tfile, tname, fname, TemporaryFolder = 2;
   tfolder = fso.GetSpecialFolder(TemporaryFolder);
   tname = fso.GetTempName();
   WScript.Echo("tname is: " + tname);
   WScript.Echo("tfolder is: " + tfolder);
   tfile = tfolder.CreateTextFile(tname);
   return(tfile);
}
tempfile = CreateTempFile();
tempfile.writeline("Hello World");
tempfile.close();

// > tname is: rad32BC2.tmp
// > tfolder is: C:\Users\IEUser\AppData\Local\Temp