import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profileImageLink: {type:String, default: "" },
    profileAccountBalance: {type:String, default: 0 },
    
    age: {type:String, default: ""},
    gender: {type:String, default: "Male" },
}, { timestamps: true });

export default mongoose.model('User', userSchema, 'users');




