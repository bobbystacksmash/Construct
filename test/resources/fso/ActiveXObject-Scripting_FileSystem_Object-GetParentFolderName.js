function ShowParentFolderName(filespec)
{
   var fso, s = "";
   fso = new ActiveXObject("Scripting.FileSystemObject");
   s += fso.GetParentFolderName(filespec);
   return(s);
}

WScript.Echo(ShowParentFolderName("C:\\fso-dir"))
// "C:\\" > ""
// "C:\\fso-dir" > "C:\"
