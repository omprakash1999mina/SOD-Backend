import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const loanSchema = new Schema({
    customerId: {type: Object, required: true },
    loanAmount: {type: String, required: true },
    tenure: {type: Object, required: true },
    intRate: {type: String, required: true },
    EMIAmount: {type: String, required: true },
    installments: {
        type: [{
            dueDate: { type: String, required: true },
            isDue: { type: Boolean, default: true }
        }],
        required: true
    },
    NextInstallment: {type: Number, required: true },
    status: {type: String, default: 'available' }
}, { timestamps: true  });

export default mongoose.model('Loan', loanSchema, 'loans');