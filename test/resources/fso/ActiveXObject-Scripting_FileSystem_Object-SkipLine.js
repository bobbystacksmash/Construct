function SkipLineDemo()
{
   var fso, f, r
   var ForReading = 1, ForWriting = 2;
   fso = new ActiveXObject("Scripting.FileSystemObject")
   f = fso.OpenTextFile("c:\\testfile.txt", ForWriting, true)
   f.WriteLine("Hello world!");
   f.WriteLine("JScript is fun");
   f.Close();
   f = fso.OpenTextFile("c:\\testfile.txt", ForReading);
   f.SkipLine();
   r = f.ReadLine();
   return(r);
}

WScript.Echo(SkipLineDemo());
// > JScript is fun