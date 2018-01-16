// https://msdn.microsoft.com/en-us/library/z0z2z1zt(v=vs.84).aspx
function GetBuildPath(path)
{
   var fso, newpath;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   newpath = fso.BuildPath(path, "FSO Folder");
   return(newpath);
}   

WScript.Echo(GetBuildPath("C:\\"));

// > C:\Fso Folder