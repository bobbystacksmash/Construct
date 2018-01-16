var fso, f;
fso = new ActiveXObject("Scripting.FileSystemObject");
f = fso.CreateTextFile("c:\\testfile.txt", true);
f.WriteLine("This is a test.");
f.Close();
f = fso.GetFile("c:\\testfile.txt");
f.Copy("c:\\windows\\desktop\\test2.txt");