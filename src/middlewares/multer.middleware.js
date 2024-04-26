import  multer from "multer"
//Multer simplifies the process of handling file uploads in Node.js applications, providing a robust and flexible solution for managing file uploads efficiently.

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "./public/temp")
    },
    filename: function(req, res, cb){
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage
})