function ReadAllTextFile()
{
    var ForReading = 1, ForWriting = 2;
    var fso = new ActiveXObject("Scripting.FileSystemObject");

    // Open the file for output.
    var filename = "c:\\testfile.txt";

    var f = fso.OpenTextFile(filename, ForWriting, true);

    // Write to the file.
    f.Write("Header");
    f.Write("1234567890987654321");
    f.Close();

    // Open the file for input.
    f = fso.OpenTextFile(filename, ForReading);

    // Read from the file.
    if (f.AtEndOfStream)
        return ("");
    else
        return (f.ReadAll());
}

WScript.Echo(ReadAllTextFile());
// > Header1234567890987654321
