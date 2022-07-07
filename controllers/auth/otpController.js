import Joi from 'joi';
import { User } from "../../models";
import CustomErrorHandler from '../../Services/CustomerrorHandler';
import discord from '../../Services/discord';
import RedisService from '../../Services/redis';
import { EMAIL_ADMIN_ID, EMAIL_ADMIN_PASSWORD, EMAIL_API_URL } from '../../config'
import axios from "axios";


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
            const type = 'otp';
            const config = {
                headers: {
                    "Content-Type": "application/json"
                }
            }
            // sending mail to user
            // console.log(user)
            let success;
            const data = { userName: user.userName, type, otp: otp.toString(), email, subject: "Regarding OTP", company: "Tech Developers", adminId: `${EMAIL_ADMIN_ID}`, password: `${EMAIL_ADMIN_PASSWORD}` }
            await axios.post(EMAIL_API_URL, data, config).then((res) => {
                success = true;
            }).catch((err) => {
                success = false;
                if(err.response){
                    discord.SendErrorMessageToDiscord(email, "Send Mail", err.response.data);
                }
                else{
                    discord.SendErrorMessageToDiscord(email, "Send Mail", err);
                }
                console.log("error in sending mail to :" + email)
            });
            // const success = await mailService.send(user.userName, type, otp.toString(), email, "", "")
            if (success) {
                // set the otp in redis
                const ttl = 60 * 10; // for 10 mins
                const ok = RedisService.createRedisClient().set(email, otp, "EX", ttl);
                if (!ok) {
                    discord.SendErrorMessageToDiscord(email, "OTP SEND", "error in setup the otp in redis !!");
                    return next(CustomErrorHandler.serverError());
                }
            }
            else {
                discord.SendErrorMessageToDiscord(email, "OTP SEND", "error in setup the otp in redis !!");
                return next(CustomErrorHandler.serverError());
            }

        } catch (err) {
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
