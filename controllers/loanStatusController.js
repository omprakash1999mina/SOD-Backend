import Joi from 'joi';
import { Loan, LoanRequest, User } from "../models";
import user from '../models/user';
import CustomErrorHandler from '../Services/CustomerrorHandler';
import discord from '../Services/discord';
import mailService from '../Services/sendMail';
import loan from '../models/loan';
import moment from 'moment';

const loanStatusReqSchema = Joi.object({
    lendersId: Joi.string().required(),
    loanId: Joi.string().required(),
    message: Joi.string(),
});

const loanStatusController = {
    async accept(req, res, next) {

        const { error } = loanStatusReqSchema.validate(req.body);
        if (error) {
            return next(CustomErrorHandler.badRequest());
        }
        const { lendersId, loanId } = req.body;

        const exist = await User.findOne({ _id: lendersId });
        if (!exist) {
            discord.SendErrorMessageToDiscord(req.body.lendersId, "Accept Loan", "user not exist in our database !!");
            return next(CustomErrorHandler.unAuthorized())
        }

        const type = 'accepted';
        let loan;
        // check does loan already accepted by someone or not
        try {
            loan = await Loan.findOne({ _id: loanId });
            if (loan.status === 'accepted') {
                return next(CustomErrorHandler.badRequest("Loan already accepted by someone !!"))
            }
            if (lendersId === loan.customerId) {
                return next(CustomErrorHandler.badRequest("Invalid loan accept request !!"))
            }
            if (exist.profileAccountBalance < loan.loanAmount) {
                return next(CustomErrorHandler.badRequest("Insufficient balance !!"))
            }
        }
        catch (err) {
            return next(err)
        }

        let document;
        try {
            document = await LoanRequest.create({
                // name: name,
                lendersId,
                loanId,
                type,
            });
            if (!document) {
                discord.SendErrorMessageToDiscord(req.body.lendersId, "Accept Loan", "error in creating loan reaquest in database !!");
                return next(CustomErrorHandler.serverError())
            }
            document = await Loan.findOneAndUpdate({ _id: loan._id }, {
                status: "accepted"
            })
            console.log(document);
            const newBalanceLender = eval(exist.profileAccountBalance) - eval(loan.loanAmount);
            const lender = await User.findOneAndUpdate({ _id: lendersId }, { profileAccountBalance: newBalanceLender })
            let user = await User.findOne({ _id: loan.customerId })
            const newBalanceUser = eval(user.profileAccountBalance) + eval(loan.loanAmount);
            user = await User.findOneAndUpdate({ _id: loan.customerId }, { profileAccountBalance: newBalanceUser })
            // console.log(lender)

            mailService.send(user.userName, 'loan-accept', user.email, lender.userName, lender.email)

        } catch (err) {
            discord.SendErrorMessageToDiscord(req.body.lendersId, "Accept Loan", err);
            return next(err);
        }

        res.status(201).json({ status: "success", msg: "Loan accepted Successfully !!!  " });
    },
    async reject(req, res, next) {
        const { error } = loanStatusReqSchema.validate(req.body);
        if (error) {
            return next(CustomErrorHandler.badRequest());
        }

        try {
            const { lendersId, loanId, message } = req.body;

            const exist = await User.exists({ _id: lendersId });
            if (!exist) {
                discord.SendErrorMessageToDiscord(req.body.lendersId, "Reject", "user not exist in our database !!");
                return next(CustomErrorHandler.unAuthorized())
            }
            const loan = await Loan.findOneAndUpdate({ _id: loanId }, {
                status: "rejected",
            });
            if (!loan) {
                discord.SendErrorMessageToDiscord(req.body.loanId, "Reject", "loan Id not exist in database !!");
                return next(new Error("No such data for reject !!!   "));
            }
            const type = "reject";

            const request = await LoanRequest.create({
                lendersId,
                loanId,
                type,
                message
            });
            if (!request) {
                discord.SendErrorMessageToDiscord(req.body.lendersId, "Reject", "error in creating loan request in database !!");
                return next(CustomErrorHandler.serverError())
            }
            document = await Loan.findOneAndUpdate({ _id: loan._id }, {
                status: "rejected"
            })
            // console.log(document);
            const lender = await User.findOne({ _id: lendersId })
            const user = await User.findOne({ _id: loan.customerId })

            mailService.send(user.userName, 'loan-reject', user.email, lender.userName, lender.email)

            res.status(201).json({ status: "success", msg: "Successfully rejected" });
        } catch (err) {
            discord.SendErrorMessageToDiscord(req.body.lendersId, "Reject", err);
            return next(CustomErrorHandler.serverError());
        }

    },
    async negotiation(req, res, next) {

        const { error } = loanStatusReqSchema.validate(req.body);
        if (error) {
            return next(CustomErrorHandler.badRequest());
        }
        //  use pagination here for big data library is mongoose pagination
        const { lendersId, loanId, message } = req.body;
        const exist = await User.exists({ _id: lendersId });
        if (!exist) {
            discord.SendErrorMessageToDiscord(req.body.lendersId, "Negotiation", "user not exist in our database !!");
            return next(CustomErrorHandler.unAuthorized())
        }
        const type = "negotiation";
        try {
            const loan = await Loan.findOne({ _id: loanId });
            if (loan.status === "available") {
                const request = await LoanRequest.create({
                    lendersId,
                    loanId,
                    type,
                    message
                });
                if (!request) {
                    discord.SendErrorMessageToDiscord(req.body.lendersId, "Negotiation", "error in creating loan request in database !!");
                    return next(CustomErrorHandler.serverError())
                }

                // console.log(document);
                const lender = await User.findOne({ _id: lendersId })
                const user = await User.findOne({ _id: loan.customerId })

                mailService.send(user.userName, 'loan-modify', user.email, lender.userName, lender.email)

                res.status(201).json({ status: "success", msg: "negotiation request posted successfully !" });
            }
            else {
                return next(CustomErrorHandler.badRequest("Loan already accepted by someone !!"))
            }
        } catch (err) {
            discord.SendErrorMessageToDiscord(req.body.lendersId, "Negotiation", err);
            return next(CustomErrorHandler.serverError());
        }

    },

    async getAllLoans(req, res, next) {

        let document;
        try {
            document = await Loan.find({ status: "available" }).select('-__v')
        } catch (error) {
            discord.SendErrorMessageToDiscord(req.body.customerId, "Get Request All Loans", error);
            return next(error)
        }
        res.status(200).json({ status: "success", loans: document });
    },

    async getLoan(req, res, next) {
        // console.log(req.params.id)
        let document;
        try {
            document = await Loan.findOne({ status: "available", _id: req.params.id }).select('-__v')
            // console.log(document)
            if (!document) {
                discord.SendErrorMessageToDiscord(req.params.id, "Get Request One loan", "Loain Id is not exist in our database !!");
                return next(CustomErrorHandler.badRequest())
            }
        } catch (error) {
            discord.SendErrorMessageToDiscord(req.params.id, "Get Request One Loan", error);
            return next(error)
        }
        res.status(200).json({ status: "success", loan: document });
    },

    async applyLoan(req, res, next) {

        const applyLoanSchema = Joi.object({
            customerId: Joi.string().required(),
            loanAmount: Joi.string().required(),
            tenure: Joi.string().required(),
            intRate: Joi.string().required(),
        });
        const { error } = applyLoanSchema.validate(req.body);
        if (error) {
            return next(CustomErrorHandler.badRequest());
        }
        // console.log('level 1')
        const exist = await User.exists({ _id: req.body.customerId });
        if (!exist) {
            discord.SendErrorMessageToDiscord(req.body.customerId, "Apply Loan", "User not exist in our database !!");
            return next(CustomErrorHandler.unAuthorized())
        }
        // console.log('level 2')

        let already_Applied_for_loan = await Loan.findOne({ customerId: req.body.customerId })
        console.log(already_Applied_for_loan)
        if (already_Applied_for_loan) {
            discord.SendErrorMessageToDiscord(req.body.customerId, "Apply Loan", "User already exist in database so not allowed to apply for new loan !!");
            return next(CustomErrorHandler.badRequest("already applied for loan !!"))
        }
        try {
            const { customerId, loanAmount, tenure, intRate } = req.body;
            let EMIAmount = (loanAmount + loanAmount * intRate) / tenure;
            let currentDate = new Date();

            let installments = installmentBreakdown(currentDate, tenure);
            const milliseconds = Date.parse(NextDate(currentDate, 1));
            // Convert milliseconds to days
            let NextInstallment = milliseconds / (24 * 3600 * 1000);

            let document = await Loan.create({
                customerId,
                loanAmount,
                tenure,
                intRate,
                EMIAmount,
                installments,
                NextInstallment
            })
            if (!document) {
                discord.SendErrorMessageToDiscord(req.body.customerId, "Apply Loan", "error in creating loan in database ");
                return next(CustomErrorHandler.serverError())
            }
            console.log(document);
        } catch (error) {
            discord.SendErrorMessageToDiscord(req.body.customerId, "Apply Loan", error);
            return next(error);
        }
        res.status(200).json({ status: "success", msg: "Loan applied successfully." });
    },

    async updateLoan(req, res, next) {
        const updateLoanSchema = Joi.object({
            customerId: Joi.string().required(),
            loanId: Joi.string().required(),
            loanAmount: Joi.string().required(),
            tenure: Joi.string().required(),
            intRate: Joi.string().required()
        })

        const { error } = updateLoanSchema.validate(req.body);
        if (error) {
            return next(CustomErrorHandler.badRequest());
        }

        try {
            const { customerId, loanId, loanAmount, tenure, intRate } = req.body;
            const exist = await User.exists({ _id: customerId });
            if (!exist) {
                discord.SendErrorMessageToDiscord(req.body.customerId, "Update Loan", "error user not exist in database ");
                return next(CustomErrorHandler.unAuthorized())
            }

            const loan = await Loan.exists({ _id: loanId })
            if (!loan) {
                return next(CustomErrorHandler.badRequest())
            }

            let EMIAmount = (loanAmount + loanAmount * intRate) / tenure;

            let currentDate = new Date();
            let installments = installmentBreakdown(currentDate, tenure);
            const milliseconds = Date.parse(NextDate(currentDate, 1));
            // Convert milliseconds to days
            let NextInstallment = milliseconds / (24 * 3600 * 1000);

            let document = await Loan.findOneAndUpdate({ _id: loanId }, {
                loanAmount,
                tenure,
                intRate,
                EMIAmount,
                installments,
                NextInstallment
            })
            if (!document) {
                discord.SendErrorMessageToDiscord(req.body.customerId, "Loan Update", "error in finding and update loanId");
                return next(CustomErrorHandler.serverError())
            }
            console.log(document);
        } catch (error) {
            discord.SendErrorMessageToDiscord(req.body.customerId, "Loan Update", error);
            return next(error);
        }
        res.status(200).json({ status: "success", msg: "Loan updated successfully." });
    },

    async updateBalance(req, res, next) {
        const updateCashSchema = Joi.object({
            customerId: Joi.string().required(),
            profileAccountBalance: Joi.string().required()
        })

        const { error } = updateCashSchema.validate(req.body);
        if (error) {
            return next(CustomErrorHandler.badRequest(error));
        }
        try {
            const { customerId, profileAccountBalance } = req.body;
            const exist = await User.exists({ _id: customerId });
            if (!exist) {
                discord.SendErrorMessageToDiscord(req.body.customerId, "Profile Account Balance update", "error user not exist in database ");
                return next(CustomErrorHandler.unAuthorized())
            }
            if (profileAccountBalance < 0) {
                return next(CustomErrorHandler.badRequest())
            }

            const document = await user.findOneAndUpdate({ _id: customerId }, {
                profileAccountBalance
            })
            if (!document) {
                console.log(document)
                return next(CustomErrorHandler.badRequest(document))
            }

        } catch (error) {
            discord.SendErrorMessageToDiscord(req.body.customerId, "Profile account balance update", error);
            return next(CustomErrorHandler.serverError())
        }
        res.status(200).json({ status: "success", msg: "Balance updated successfully." });
    },

    async payInstallment(req, res, next) {
        const payInstallmentSchema = Joi.object({
            customerId: Joi.string().required(),
            loanId: Joi.string().required()
        })

        const { error } = payInstallmentSchema.validate(req.body);
        if (error) {
            return next(CustomErrorHandler.badRequest(error));
        }
        try {
            const { customerId, loanId } = req.body;
            const customerExist = await User.findOne({ _id: customerId });
            const loanExist = await loan.findOne({ _id: loanId });
            if (!customerExist || !loanExist) {
                discord.SendErrorMessageToDiscord(req.body.customerId, "Installment Payment", "error user or loan not exist in database ");
                return next(CustomErrorHandler.unAuthorized())
            }
            let balance = customerExist.profileAccountBalance;
            let EMIAmount = loanExist.EMIAmount;
            if (balance < 0 || balance < EMIAmount) {
                return next(CustomErrorHandler.badRequest())
            }
            let profileAccountBalance = balance - EMIAmount;
            const userUpdated = await user.findOneAndUpdate({ _id: customerId }, {
                profileAccountBalance
            })
            let currentInstallment = loanExist.currentInstallment;
            currentInstallment = currentInstallment + 1;

            const loanUpdated = await loan.findOneAndUpdate({ _id: loanId }, {
                currentInstallment
            })

            if (!userUpdated || !loanUpdated) {
                console.log(userUpdated)
                console.log(loanUpdated)
                return next(CustomErrorHandler.badRequest(userUpdated))
            }

        } catch (error) {
            discord.SendErrorMessageToDiscord(req.body.customerId, "Installment Payment", error);
            return next(CustomErrorHandler.serverError())
        }
        res.status(200).json({ status: "success", msg: "Balance updated successfully." });
    }

}
export default loanStatusController;


const NextDate = (currentDate, steps = 1) => {
    let newDate = new Date();
    newDate.setDate(currentDate.getDate() + 30 * steps);
    return newDate.toString("");
}

const installmentBreakdown = (currentDate, tenure) => {
    let installments = Array(tenure);
    for (let i = 0; i < tenure; i++) {
        installments[i] = { dueDate: NextDate(currentDate, i + 1), isDue: true };
    }
    return installments;
}