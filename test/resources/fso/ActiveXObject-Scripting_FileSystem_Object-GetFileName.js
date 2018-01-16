function ShowFileName(filespec)
{
   var fso, s = "";
   fso = new ActiveXObject("Scripting.FileSystemObject");
   s += fso.GetFileName(filespec);
   return(s);
}

WScript.Echo(ShowFileName("C:\\fso-dir\\bar.txt"))
// > foo.txt
// > bar.txt (even if it doesn't exist)
