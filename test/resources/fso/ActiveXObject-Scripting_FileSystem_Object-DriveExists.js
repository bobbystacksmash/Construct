function ReportDriveStatus(drv)
{
   var fso, s = "";
   fso = new ActiveXObject("Scripting.FileSystemObject");
   if (fso.DriveExists(drv))
      s += "Drive " + drv + " exists.";
   else 
      s += "Drive " + drv + " doesn't exist.";
   return(s);
}

WScript.Echo(ReportDriveStatus("C"));

// > Drive C exists.
