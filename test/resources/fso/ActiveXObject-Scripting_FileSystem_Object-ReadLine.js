var ForReading = 1, ForWriting = 2, ForAppending = 8;

var fso = new ActiveXObject("Scripting.FileSystemObject");

// Open the file for output.
var filename = "c:\\testfile.txt";

var f = fso.OpenTextFile(filename, ForWriting, true);

// Write to the file.
f.WriteLine("Hello world!");
f.WriteLine("The quick brown fox");
f.Close();

// Open the file for input.
f = fso.OpenTextFile(filename, ForReading);

// Read from the file and display the results.
while (!f.AtEndOfStream)
    {
    var r = f.ReadLine();
    WScript.Echo("# " + r);
    }
f.Close();

// > # Hello world!
// > # The quick brown box