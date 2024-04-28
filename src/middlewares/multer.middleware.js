import  multer from "multer"
//Multer simplifies the process of handling file uploads in Node.js applications, providing a robust and flexible solution for managing file uploads efficiently.

const storage = multer.diskStorage({
    destination: "../../public/temp",
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})


// const storage = multer.diskStorage({ 
// destination: "../../public/temp",
// filename: (req, file, cb) => { 
//     cb(null, Date.now() + "-" + file.originalname); }, 
// });

export const upload = multer({
    storage
})