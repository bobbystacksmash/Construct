function ShowFileAccessInfo(filespec)
{
   var fso, f, s;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   
	try {
		f = fso.GetFile(filespec);
		s = f.Path.toUpperCase() + "|";
		s += "Created: " + f.DateCreated + "|";
		s += "Last Accessed: " + f.DateLastAccessed + "|";
		s += "Last Modified: " + f.DateLastModified   
	   	return(s);
	}
	catch (e) {
		return (e.message);
	}
}

WScript.Echo(ShowFileAccessInfo("C:\\fso-dir\\foo.txt"));
// > File not found
// > C:\FSO-DIR\FOO.TXT|Created: Sun Jan 14 09:22:17 PST 2018|Last Accessed: Sun Jan 14 09:22:17 PST 2018|Last Modified: Sun Jan 14 09:22:17 PST 2018