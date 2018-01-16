function GetHeader()
{
   var fso, f;
   var ForReading = 1, ForWriting = 2;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   f = fso.OpenTextFile("c:\\testfile.txt", ForWriting, true);
   f.Write("Header");
   f.Write("1234567890987654321");
   f.Close();
   f = fso.OpenTextFile("c:\\testfile.txt", ForReading);
   return(f.Read(6));
}

WScript.Echo(GetHeader())
// > Header