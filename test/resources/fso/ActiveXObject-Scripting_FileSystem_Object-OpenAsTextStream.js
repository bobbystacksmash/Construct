Const ForReading = 1, ForWriting = 2, ForAppending = 8
Const TristateUseDefault = -2, TristateTrue = -1, TristateFalse = 0
Dim fso, ts, fileObj, TextLine

Set fso = CreateObject("Scripting.FileSystemObject")

' Create the file, and obtain a file object for the file.
FileName = "c:\testfile.txt"
fso.CreateTextFile FileName
Set fileObj = fso.GetFile(FileName)

' Open a text stream for output.
Set ts = fileObj.OpenAsTextStream(ForWriting, TristateUseDefault)

' Write to the text stream.
ts.WriteLine "Hello World!"
ts.WriteLine "The quick brown fox"
ts.Close

' Open a text stream for input.
Set ts = fileObj.OpenAsTextStream(ForReading, TristateUseDefault)

' Read from the text stream and display the results.
Do While ts.AtEndOfStream <> True
    TextLine = ts.ReadLine
    Document.Write TextLine & "<br />"
Loop

ts.Close