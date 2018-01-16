function ShowAbsolutePath(path)
{
   var fso, s= "";
   fso = new ActiveXObject("Scripting.FileSystemObject");
   s += fso.GetAbsolutePathName(path);
   return(s);
}

WScript.Echo(ShowAbsolutePath("C:\\test"));
// > C:\test