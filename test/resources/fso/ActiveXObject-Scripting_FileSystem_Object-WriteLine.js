var fso, f;
fso = new ActiveXObject("Scripting.FileSystemObject");
f = fso.CreateTextFile("c:\\testfile.txt", true);
f.WriteLine("This is a test.");
f.Close();

// File contains:
// 54 68 69 73 20 69 73 20 61 20 74 65 73 74 2E 0D 0A
// This is a test.

