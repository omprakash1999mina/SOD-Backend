import { Loan, User } from "../models";
import CustomErrorHandler from '../Services/CustomerrorHandler';
import discord from '../Services/discord';
import kafka from '../Services/Kafka';
import moment from 'moment';
import { NOTIFICATION_KEY, NOTIFICATION_USERNAME, OWNER_EMAIL, TEMPLATE_ID_LOAN_DUE } from '../config';
import Logger from "../Services/logger";

const NotificationController = {
    async DailyCheck(req, res, next) {
        const { username, key } = req.params;
        const ok = validate(username, key);
        if (!ok) {
            return next(CustomErrorHandler.badRequest());
        }
        try {
            const today = moment().utcOffset(330);
            const days = (today.valueOf())/(24*3600*1000)
            // console.log(days)
            let loan;
            loan = await Loan.find({ NextInstallment: {$lte: days} }).select('customerId -_id');
            // loan = await Loan.find().select('customerId -_id');
            let userIds = []
            if(loan.length == 0){
                res.status(200).json({ status: "success", msg: "No Notifications exist to process !" });
                return;
            }
            loan.map(obj => userIds.push(obj.customerId))
            let data = await User.find({ '_id': { $in: userIds } }).select('userName email -_id').lean();
            
            if (data) {
                // console.log("Before:");
                // console.log(data);
                const externalFields = { From: `${OWNER_EMAIL}`, MailName: "", Subject: "Payment Due!", company: "LoanCorner", TemplateId: `${TEMPLATE_ID_LOAN_DUE}` }
                data = data.map(user => {
                    user['To'] = user['email'];
                    Object.keys(externalFields).forEach(key => {
                        const value = externalFields[key];
                        user[key]=value;
                    });
                    return user;
                });
                // console.log("After: ")
                // console.log(data)
                kafka.send(data);
            }
            else {
                Logger.warn("No loan EMIs due");
                discord.SendErrorMessageToDiscord(loan, "Notification Controller", "No loan EMIs due");
            }

        } catch (err) {
            Logger.error("Notification Controller", err)
            discord.SendErrorMessageToDiscord("System", "Notification Controller", err);
            return next(err);
        }

        res.status(200).json({ status: "success", msg: "Notifications Initiated Successfully !!!" });
    }
}
export default NotificationController;

const validate = (username, key) => {
    return (username == NOTIFICATION_USERNAME && key == NOTIFICATION_KEY);
}