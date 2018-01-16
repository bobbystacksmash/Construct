function ShowFreeSpace(drvPath)
{
   
  try {
var fso, d, s ="";
   fso = new ActiveXObject("Scripting.FileSystemObject");
   d = fso.GetDrive(fso.GetDriveName(drvPath));
   s = "Drive " + drvPath.toUpperCase( ) + " - ";
   s += d.VolumeName + " ";
   s += "Free Space: " + d.FreeSpace/1024 + " Kbytes";
   return(s);
  }
  catch (e) {
  	return(e.message)
  }

   
}

WScript.Echo(ShowFreeSpace("D:"));
// > Drive C: -  Free Space: 117815856 Kbytes
// > Disk not ready