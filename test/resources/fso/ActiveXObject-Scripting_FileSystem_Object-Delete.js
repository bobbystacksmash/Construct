var fso, f;
fso = new ActiveXObject("Scripting.FileSystemObject");
f = fso.CreateTextFile("c:\\testfile.txt", true);
f.WriteLine("This is a test.");
f.Close();
f = fso.GetFile("c:\\testfile.txt");
f.Delete();

// Just keep running it - no errors. File gets deleted.