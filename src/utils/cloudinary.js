import {v2 as cloudinary} from "cloudinary"
//file system(fs is used to manage files like read, write or anything related to file like removing)
import fs from "fs"

//this cloudinary configuration will give permision for uploading files , as it will not know itself who is loggin in
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/*It first checks if localFilePath exists; if not, it returns null.
If a file path exists, it calls cloudinary.uploader.upload() to upload the file.
The resource_type: "auto" option lets Cloudinary detect the file type automatically.
The await keyword waits for the upload to finish and stores the result in response
//localfile path is the file to be uploaded*/
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file has been uploaded succefully
        //after uploading the public url available is reponse.url
        //console.log("File is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        //if its not uploaded successfully and the file is in the server, then we need to delete the file
        //from the server because file is malicious so 
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}



