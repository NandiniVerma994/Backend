import multer from "multer";

//we are using disk storage
const storage = multer.diskStorage({
    //cb is callback, file access is ther in multer so we use multer
    destination: function (req, file, cb) {
        //folder in which we will keep the files
      cb(null, "./public/temp")
    },
    //what will be the filename
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  /* multer.diskStorage() → Tells multer to save files on disk.
destination function → Defines the folder where uploaded files will go.
Here: it uses "./public/temp" → meaning files will be saved in the public/temp folder.
cb(null, folder) → the null means “no error”; folder is the path.
filename function → Sets the name of the saved file.
Here: it keeps the original name (file.originalname) from the uploaded file.
cb(null, name) → again, null for no error, and name is the filename.*/
  
export const upload = multer({
  storage,
})