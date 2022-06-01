import mongoose from 'mongoose';
const Schema = mongoose.Schema;
 
const loanSchema = new Schema({
    customerId: {type: Object, required: true },
    loanAmount: {type: String, required: true },
    tenure: {type: Object, required: true },
    intRate: {type: String, required: true },
    status: {type: String, default: 'available' }
}, { timestamps: true  });

export default mongoose.model('Loan', loanSchema, 'loans');
