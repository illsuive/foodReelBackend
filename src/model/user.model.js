import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName : {type : String , required : true},
    email : {type : String , required : true , unique : true},
    bookmarks : [{type : mongoose.Schema.Types.ObjectId, ref : "Food"}],
    password : {type : String , select : false },
    orders : [{type : mongoose.Schema.Types.ObjectId, ref : "Order"}],
},{timestamps : true})

const User = mongoose.model('User' , userSchema)

export default User;