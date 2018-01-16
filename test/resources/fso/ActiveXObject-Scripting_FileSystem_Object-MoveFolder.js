function MoveFldr2Desktop(fldrspec)
{
   var fso;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   try {
   	fso.MoveFolder(fldrspec, "c:\\temp1");
   	WScript.Echo("Moved " + fldrspec + " to: C:\\temp1");
   } catch (e) {
   	WScript.Echo(e.message);
   }
}


WScript.Echo(MoveFldr2Desktop("C:\\fso-test\\test"));
// either path ! exists > Path not found
//if temp1 exists > File already exists
// > Moved C:\fso-test\test to: C:\temp1