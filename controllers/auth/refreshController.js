import Joi from 'joi';
import { User } from "../../models";
import CustomErrorHandler from '../../Services/CustomerrorHandler';
import JwtService from '../../Services/JwtService';
import { REFRESH_SECRET } from '../../config';
import discord from '../../Services/discord';
import RedisService from '../../Services/redis';


const refreshController = {

    async refresh(req, res, next) {
        // refresh  Logic

        const refreshSchema = Joi.object({
            refresh_token: Joi.string().required()
        });
        const { error } = refreshSchema.validate(req.body);

        if (error) {
            return next(error);
        }
        //   DataBasse   
        let refreshtoken;

        try {
            let userId;
            try {
                const { _id } = JwtService.verify(req.body.refresh_token, REFRESH_SECRET);
                userId = _id;
                const redis = RedisService.createRedisClient();
                await redis.get(userId).then((res) => {
                    refreshtoken = res;
                    redis.disconnect();
                })
                if (refreshtoken === null) {
                    discord.SendErrorMessageToDiscord(req.body.refresh_token, "Refresh token", "invalid refresh token !!");
                    return next(CustomErrorHandler.unAuthorized(' Invalid refresh token'));
                }

            } catch (err) {
                Logger.error("Refresh token", err);
                discord.SendErrorMessageToDiscord(req.body.refresh_token, "Refresh token", err);
                return next(CustomErrorHandler.unAuthorized('  Invalid refresh token'));
            }

            const user = await User.findOne({ _id: userId });
            if (!user) {
                discord.SendErrorMessageToDiscord(req.body.refresh_token + "\n" + userId, "Refresh token", "invalid refresh token user not exist !!");
                return next(CustomErrorHandler.unAuthorized('  Invalid refresh token !!  '));
            }

            //       Tokens
            const access_token = JwtService.sign({ _id: user._id });
            const refresh_token = req.body.refresh_token;

            res.status(200).json({ access_token, refresh_token });
        } catch (err) {
            Logger.error("Something went wrong  !!! " ,err.message);
            return next(new Error("Something went wrong  !!! " + err.message));
        }

    }
}

export default refreshController;
