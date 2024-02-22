import Joi from 'joi';
import { User } from "../../models";
import CustomErrorHandler from '../../Services/CustomerrorHandler';
import bcrypt from 'bcrypt';
import JwtService from '../../Services/JwtService';
import firebaseServices from '../../Services/firebaseConfig';
import discord from '../../Services/discord';
import RedisService from '../../Services/redis';
import KafkaService from '../../Services/Kafka';
import { OWNER_EMAIL, TEMPLATE_ID_SIGNUP_SUCCESS } from '../../config';

const registerController = {

    async register(req, res, next) {

        // validation
        const registerSchema = Joi.object({
            userName: Joi.string().min(3).max(100).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).max(50).required(),
            profileImageLink: Joi.string().required(),
        });

        const { error } = registerSchema.validate(req.body);
        let ok = false;

        if (error) {
            if (req.body.profileImageName) {
                ok = firebaseServices.DeleteFileInFirebase(req.body.profileImageName)
            }
            // implimetation for discord error logs
            if (!ok) {
                discord.SendErrorMessageToDiscord(req.body.email, "Register User", "error in deleting files in firebase !!");
                console.log("failed to deleting file")
            }
            else {
                discord.SendErrorMessageToDiscord(req.body.email, "Register User", error + " and All files deleted successfully");
                console.log("error accurs and all files deleted on firebase successfully")
            }
            return next(error);
        }
        try {
            const exist = await User.exists({ email: req.body.email });
            if (exist) {
                // implimetation for discord error logs
                discord.SendErrorMessageToDiscord(req.body.email, "Register User", "error the email is already exist ");
                return next(CustomErrorHandler.alreadyExist('This email is already taken . '));
            }
        } catch (err) {
            Logger.error(req.body.email, "Register User" ,err.message);
            return next(err);
        }
        const { userName, email, profileImageLink, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        let document;
        let access_token;
        let refresh_token;

        try {
            document = await User.create({
                userName,
                email,
                profileImageLink,
                password: hashedPassword
            });
            console.log(document);

            access_token = JwtService.sign({ refresh_token: document._id });
            refresh_token = JwtService.sign({ _id: document._id });
            //redis caching
            const data = { To: email,userName: userName, From: `${OWNER_EMAIL}`, MailName: "", Subject: "Successfully Registered", company: "LoanCorner", TemplateId: `${TEMPLATE_ID_SIGNUP_SUCCESS}` }
            KafkaService.send([data]);
            const ttl = 60 * 60 * 24 * 7;
            const working = RedisService.createRedisClient().set(document._id, refresh_token, "EX", ttl);
            // const working = RedisService.set(email, refresh_token, ttl);
            if (!working) {
                discord.SendErrorMessageToDiscord(email, "LogIN", "error in setup the otp in redis !!");
                return next(CustomErrorHandler.serverError());
            }

        } catch (err) {
            Logger.error(req.body.email, "Register User" ,err.message);
            discord.SendErrorMessageToDiscord(req.body.email, "Register User", err);
            return next(err);
        }
        res.status(201).json({ id: document._id, msg: "User Registered Successfully !!!  ", access_token: access_token, refresh_token: refresh_token });

    }
};

export default registerController;
