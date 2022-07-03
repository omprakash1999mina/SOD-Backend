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
    aadhaarNumber: {type:String, default: "" },
    panNumber: {type:String, default: "" },
    ctc: {type:String, default: "" },
    cibilScore: {type:String, default: "" },
    aadhaarImageLink: {type:String, default: "" },
    panImageLink: {type:String, default: "" },
    salarySlipImageLink: {type:Array, default: [] },
    accountHolderName: {type:String, default: "" },
    accountNumber: {type:String, default: "" },
    IFACcode: {type:String, default: "" },
    BankName: {type:String, default: "" },

}, { timestamps: true });

export default mongoose.model('User', userSchema, 'users');




