import Joi from 'joi';
import { User ,RefreshToken } from "../../models";
import CustomErrorHandler from '../../Services/CustomerrorHandler';
import JwtService from '../../Services/JwtService';
import { REFRESH_SECRET } from '../../config';
import discord from '../../Services/discord';

const forgotPasswordController = {

     async forgot(req, res, next){

        const forgotPasswordSchema = Joi.object({
            otp: Joi.string().required(),
            password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(8).max(50).required()
        });

        const { error } = forgotPasswordSchema.validate(req.body);

        if(error){
            return next(error);
        }
        //   DataBasse   
        try{
            if(!refreshtoken){
                discord.SendErrorMessageToDiscord(req.body.refresh_token, "Refresh token", "invalid refresh token !!");
                return  next( CustomErrorHandler.unAuthorized(' Invalid refresh token'));
            }    

            let userId;
            // console.log(refreshtoken.refresh_token);
            try{
                const { _id } = JwtService.verify(refreshtoken.refresh_token , REFRESH_SECRET);
                userId = _id;
            }catch(err){
                discord.SendErrorMessageToDiscord(req.body.refresh_token, "Refresh token", err);
                return next(CustomErrorHandler.unAuthorized('  Invalid refresh token'));
            }

            const user = await User.findOne({_id: userId});
            if(!user){
                discord.SendErrorMessageToDiscord(req.body.refresh_token + "\n"+ userId, "Refresh token", "invalid refresh token user not exist !!");
                return next(CustomErrorHandler.unAuthorized('  Invalid refresh token !!  '));
            }

                //       Tokens
            const access_token = JwtService.sign({_id: user._id, role: user.role } );
            const refresh_token = JwtService.sign({_id: user._id, role: user.role },'7d',REFRESH_SECRET);
    
                //       Database Whitelilst 
            RefreshToken.create({refres_htoken: refresh_token});
            res.json({access_token , refresh_token});


        }catch(err){
            return next(new Error("Somthing went wrong  !!! " + err.message));
        }

    }
}

export default forgotPasswordController;
