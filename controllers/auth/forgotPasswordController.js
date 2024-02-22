import Joi from 'joi';
import { User } from "../../models";
import CustomErrorHandler from '../../Services/CustomerrorHandler';
import bcrypt from 'bcrypt';
import discord from '../../Services/discord';
import RedisService from '../../Services/redis';
import Logger from '../../Services/logger';

const forgotPasswordController = {

    async forgot(req, res, next) {

        const forgotPasswordSchema = Joi.object({
            email: Joi.string().required(),
            otp: Joi.number().required(),
            password: Joi.string().min(8).max(50).required()
        });

        const { error } = forgotPasswordSchema.validate(req.body);

        if (error) {
            return next(CustomErrorHandler.badRequest());
        }
        //   DataBasse   
        try {
            const { email, otp, password } = req.body;
            const exist = await User.exists({ email: email });
            if (!exist) {
                discord.SendErrorMessageToDiscord(email, "Forgot password", "user not exist in our database !!");
                return next(CustomErrorHandler.unAuthorized())
            }
            // verifing the otp with redis
            let redisOTP;
            await RedisService.createRedisClient().get(email).then((res) => {
                redisOTP = res
            });
            if (redisOTP === null) {
                return next(CustomErrorHandler.unAuthorized("OTP expired !!"));
            }
            if (redisOTP != otp) {
                return next(CustomErrorHandler.badRequest("invalid OTP !"))
            }
            // if otp verified then update in database
            const hashedPassword = await bcrypt.hash(password, 10);
            let document = await User.findOneAndUpdate({ email: email }, {
                password: hashedPassword
            })
            if (!document) {
                discord.SendErrorMessageToDiscord(req.body.email, "forgot password", err);
            }
            // after update the password delete otp in redis cache
            const deleted = RedisService.createRedisClient().del(req.body.email);
            if (!deleted) {
                Logger.error("Forgot password", "error in deleting otp in redis !!");
                discord.SendErrorMessageToDiscord(req.body.email, "Forgot password", "error in deleting otp in redis !!");
            }
        } catch (err) {
            Logger.error("Forgot password", err);
            discord.SendErrorMessageToDiscord(req.body.email, "forgot password", err);
            return next(CustomErrorHandler.serverError());
        }
        res.status(201).json({ status: "success", msg: "Password updated Successfully !!!  " });

    }
}

export default forgotPasswordController;
