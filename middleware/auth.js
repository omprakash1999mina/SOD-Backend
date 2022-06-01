import JwtService from "../Services/JwtService";
import CustomErrorHandler from "../Services/CustomerrorHandler";

   const auth = async (req, res, next)=> {
        let authHeader = req.headers.authorization;
        
        if(!authHeader){
            return next(CustomErrorHandler.unAuthorized());

        }

        const token = authHeader.split(' ')[1];
        try{
            const {_id} = await JwtService.verify(token);

            const user = {
                _id,
            }

            req.user = user;
            next();

        }catch(err){
            return next(CustomErrorHandler.unAuthorized());
        }
        
   }

   export default auth;

