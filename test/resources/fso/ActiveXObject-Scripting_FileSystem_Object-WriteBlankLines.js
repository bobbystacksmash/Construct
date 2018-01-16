function WriteBlanksDemo()
{
   var fso, f, r;
   var ForReading = 1, ForWriting = 2;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   f = fso.OpenTextFile("c:\\testfile.txt", ForWriting, true);
   f.Write("Hello world!");
   f.WriteBlankLines(2);
   f.Write("JScript is fun!");
   f.Close();
   f = fso.OpenTextFile("c:\\testfile.txt", ForReading);
   r = f.ReadAll();
   return(r);
}

WScript.Echo(WriteBlanksDemo());
// > Hello world!
// >
// > JScript is fun!