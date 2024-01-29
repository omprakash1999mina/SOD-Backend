import { Loan, User } from "../models";
import CustomErrorHandler from '../Services/CustomerrorHandler';
import discord from '../Services/discord';
import kafka from '../Services/Kafka';
// import moment from 'moment';
import { NOTIFICATION_KEY, NOTIFICATION_USERNAME } from '../config';

const NotificationController = {
    async DailyCheck(req, res, next) {
        const {username,key } = req.params;
        const ok = validate(username,key);
        if (!ok) {
            return next(CustomErrorHandler.badRequest());
        }
        try {
            // const today = moment().utcOffset(330);
            let loan;
            // loan = await Loan.find({ NextInstallment: {$lte: today.milliseconds()} }).select('customerId -_id');
            loan = await Loan.find().select('customerId -_id');
            let userIds=[]
            loan.map(obj => userIds.push(obj.customerId))
            // console.log(userIds)
            let data = await User.find({'_id': {$in: userIds}}).select('userName email -_id');
            // console.log(users);
            if(data){
                console.log(data);
                kafka.send(data);
            }
            else{
                discord.SendErrorMessageToDiscord(loan, "Notification Controller", "No loan EMI's due");
            }

        } catch (err) {
            discord.SendErrorMessageToDiscord("System", "Notification Controller", err);
            return next(err);
        }

        res.status(200).json({ status: "success", msg: "Notifications Initiated Successfully !!!" });
    }
}
export default NotificationController;

const validate = (username,key)=>{
    return (username==NOTIFICATION_USERNAME && key==NOTIFICATION_KEY);
}