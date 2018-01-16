var fso;
fso = new ActiveXObject("Scripting.FileSystemObject");
a = fso.CreateTextFile("c:\\testfile.txt", true);
a.WriteLine("This is a test.");
a.Close();