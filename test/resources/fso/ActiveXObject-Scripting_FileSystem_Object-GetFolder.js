function ShowFolderList(path) {
    var fso = new ActiveXObject("Scripting.FileSystemObject");

    try {
		var folder = fso.GetFolder(path);
		    var subFlds = new Enumerator(folder.SubFolders);

		    var s = "";
		    for (; !subFlds.atEnd(); subFlds.moveNext()) {
		        s += subFlds.item()
		        s += "|";
		    }
		    return (s);
    }
    catch (e) {
    	return e.message;
    }
    
}

WScript.Echo(ShowFolderList("D:\\"));
// > C:\$Recycle.Bin|C:\cmder|C:\Documents and Settings|C:\emacs|C:\fso-dir|C:\fso-test|C:\MinGW|C:\PerfLogs|C:\Program Files|C:\ProgramData|C:\Python27|C:\Recovery|C:\sysinternals|C:\System Volume Information|C:\Users|C:\Wallpaper|C:\Windows|
// > Path not found