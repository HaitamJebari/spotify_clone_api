const cloudinary = require("../config/cloudinary")

//work on files when user upload image we gonna copy it in uploads folder
const fs = require("fs")


const uploadToCloudinary = async (filePath, folder)=>{
    try{
        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: "auto"
        });
        //delete local files after succeful upload
        // fs.unlinkSync(filePath);
        return result;
    } catch (err){
        //delete local file in case of error
        if(fs.existsSync(filePath)){
            fs.unlinkSync(filePath)
        }
        throw new Error("Failed to upload to cloudinary", err.message)
    }
}

module.exports = {
    uploadToCloudinary
}