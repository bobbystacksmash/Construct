function DeleteFolder(folderspec)
{
   var fso;
   fso = new ActiveXObject("Scripting.FileSystemObject");
   fso.DeleteFolder(folderspec);
}
