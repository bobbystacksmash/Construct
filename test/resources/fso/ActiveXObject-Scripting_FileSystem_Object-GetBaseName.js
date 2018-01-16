function ShowBaseName(filespec)
{
   var fso, s = "";
   fso = new ActiveXObject("Scripting.FileSystemObject");
   s += fso.GetBaseName(filespec);
   return(s);
}

WScript.Echo(ShowBaseName("C:\\foo\\bar\\baz.txt"));
// > baz