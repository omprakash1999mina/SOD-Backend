import Joi from 'joi';
import { User } from "../../models";
import CustomErrorHandler from '../../Services/CustomerrorHandler';
import discord from '../../Services/discord';
import RedisService from '../../Services/redis';
import KafkaService from '../../Services/Kafka';
import { OWNER_EMAIL,TEMPLATE_ID_FORGOT_PASSWORD } from '../../config';

const otpController = {

    async send(req, res, next) {

        const otpSchema = Joi.object({
            email: Joi.string().email().required(),
        });

        const { error } = otpSchema.validate(req.body);

        if (error) {
            return next(CustomErrorHandler.badRequest());
        }
        //   DataBasse   
        try {
            const { email } = req.body;
            const user = await User.findOne({ email: email });
            if (!user) {
                discord.SendErrorMessageToDiscord(email, "OTP SEND", "user not exist in our database !!");
                return next(CustomErrorHandler.unAuthorized())
            }
            const otp = generateOtpCode();
            const config = {
                headers: {
                    "Content-Type": "application/json"
                }
            }
            // sending mail to user
            // let success;
            const data = { To: email,userName: user.userName, code: otp.toString(), From: `${OWNER_EMAIL}`, MailName: "", Subject: "Regarding OTP", company: "LoanCorner", TemplateId: `${TEMPLATE_ID_FORGOT_PASSWORD}` }
            KafkaService.send([data]);
            // console.log(data)
            // if (success) {
                // set the otp in redis
            const ttl = 60 * 10; // for 10 mins
            const ok = RedisService.createRedisClient().set(email, otp, "EX", ttl);
            if (!ok) {
                Logger.error("OTP SEND", "error in setup the otp in redis !!");
                discord.SendErrorMessageToDiscord(email, "OTP SEND", "error in setup the otp in redis !!");
                return next(CustomErrorHandler.serverError());
            }
            // }
            // else {
            //     discord.SendErrorMessageToDiscord(email, "OTP SEND", "error in setup the otp in redis !!");
            //     return next(CustomErrorHandler.serverError());
            // }

        } catch (err) {
            Logger.error("OTP SEND", err);
            discord.SendErrorMessageToDiscord(req.body.email, "OTP SEND", err);
            return next(CustomErrorHandler.serverError());
        }
        res.status(201).json({ status: "success", msg: "mail sent Successfully !!!  " });
    }
}

export default otpController;
const generateOtpCode = () => {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return randomNumber;
}
