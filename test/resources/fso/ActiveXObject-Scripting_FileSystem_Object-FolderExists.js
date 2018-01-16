function ReportFolderStatus(fldr)
{
   var fso, s = fldr;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   if (fso.FolderExists(fldr))
      s += " exists.";
   else 
      s += " doesn't exist.";
   return(s);
}

WScript.Echo(ReportFolderStatus("C:\\"))
// > C:\ doesn't exist.
// > C:\ exists.