// require('dotenv').config()
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import express from 'express'
const app = express()


dotenv.config({
    path: "./env"
});

connectDB()

.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Mongo DB Connection Failed!", err);
})


// Just for Demo purpose
//Immediately Invoked Function Expression--> Another way to connect to databases and listening over ports
// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}`);
//         console.log('DB Connected');
//         app.on('Error', ()=>{
//             console.error('ERROR:', error)
//             throw error
//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log(`Listening on PORT: ${process.env.PORT}`);
//         })
//     } catch(error) {
//         console.error('ERROR:', error);
//         throw error
//     }
// })()

