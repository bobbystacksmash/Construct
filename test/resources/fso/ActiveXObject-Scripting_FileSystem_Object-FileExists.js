function ReportFileStatus(filespec)
{
   var fso, s = filespec;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   if (fso.FileExists(filespec))
      s += " exists.";
   else 
      s += " doesn't exist.";
   return(s);
}

WScript.Echo(ReportFileStatus("C:\\foo.txt"))
// > C:\foo.txt doesn't exist.
// > C:\foo.txt exists.