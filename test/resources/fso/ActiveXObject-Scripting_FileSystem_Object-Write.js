function WriteDemo()
{
   var fso, f, r
   var ForReading = 1, ForWriting = 2;
   fso = new ActiveXObject("Scripting.FileSystemObject")
   f = fso.OpenTextFile("c:\\testfile.txt", ForWriting, true)
   f.Write("Hello world!");
   f.Close();
   f = fso.OpenTextFile("c:\\testfile.txt", ForReading);
   r = f.ReadLine();
   return(r);
}

WScript.Echo(WriteDemo());
// > Hello world!