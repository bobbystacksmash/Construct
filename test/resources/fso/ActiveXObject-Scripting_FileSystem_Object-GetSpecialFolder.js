var fso, tempfile;
fso = new ActiveXObject("Scripting.FileSystemObject");

function CreateTempFile()
{
   var tfolder, tfile, tname, fname, TemporaryFolder = 2;
   tfolder = fso.GetSpecialFolder(TemporaryFolder);
   tname = fso.GetTempName();
   WScript.Echo("tname is: " + tname);
   tfile = tfolder.CreateTextFile(tname);
   return(tfile);
}
tempfile = CreateTempFile();
tempfile.writeline("Hello World");
tempfile.close();

// > tname is: rad43811.tmp / rad2C693.tmp / ...