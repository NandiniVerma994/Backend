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
  
export const upload = multer({ 
    storage, 
})