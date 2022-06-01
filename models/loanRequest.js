import mongoose from 'mongoose';
const Schema = mongoose.Schema;
 
const loanRequestSchema = new Schema({
    loanId: {type: Object, required: true },
    lendersId: {type: Object, required: true },
    type: {type: String, required:true },
    message: {type: String, default: "" }
}, { timestamps: true  });

export default mongoose.model('LoanRequest', loanRequestSchema, 'loanRequests');