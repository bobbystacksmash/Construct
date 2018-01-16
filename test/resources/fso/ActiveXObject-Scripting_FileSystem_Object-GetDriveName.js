function GetDriveLetter(path)
{
   var fso, s ="";
   fso = new ActiveXObject("Scripting.FileSystemObject");
   s += fso.GetDrive(fso.GetDriveName(fso.GetAbsolutePathName(path)));
   return(s);
}

WScript.Echo(GetDriveLetter("C:\\foo\\bar\\baz.txt"));
// C: