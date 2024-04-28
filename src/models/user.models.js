import mongoose, {Schema} from "mongoose"
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, //Leading or trailing whitespace in the value of the username field is removed before it is stored in the database.
        index: true //Helps to search in database with help of mongoose
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Video'
        }
    ],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
})

userSchema.pre('save', async function(next){
  
    try {
        if(!this.isModified('password')) return next();
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        return next(error); //Pass error  to the next middleware
    }
})

userSchema.methods.isPasswordCorrect =  async function(password){
   try {
     return await bcrypt.compare(password, this.password)
   } catch (error) {
     return false; //Return false in case of error
   }
}

//This works complete fastly so need of async and await
userSchema.methods.generateAccessToken =  function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function(){
    //No await needed coz sign fn--> Synchronously sign the given payload into a JSON Web Token string payload
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema);
//User--> Will be used in controllers to do findById and 'User' is saved as users in the MongoDB database