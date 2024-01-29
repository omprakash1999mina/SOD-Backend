import Joi from 'joi';
import { User } from "../models";
import user from '../models/user';
import CustomErrorHandler from '../Services/CustomerrorHandler';
import discord from '../Services/discord';

const EmiNotificaiontController = {
    async payInstallment(req, res, next) {
        try {
            const exist = await User.exists({ _id: customerId });
            if (!exist) {
                discord.SendErrorMessageToDiscord("Server", "EMI Notification Service", "error user not exist in database ");
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
            discord.SendErrorMessageToDiscord("Server", "EMI Notification Service", error);
            return next(CustomErrorHandler.serverError())
        }
        res.status(200).json({ status: "success", msg: "Balance updated successfully." });
    }
}
export default EmiNotificaiontController;

// {
// 	"userName":"Rishabh Singh",
// 	"type":"success",
// 	"email":"example@gmail.com",
// 	"company":"OpDevelopers PVT LTD",
// 	"adminId":"youradmin",
// 	"password":"yourpass"
// }
