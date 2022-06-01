import axios from "axios";
import { EMAIL_ADMIN_ID, EMAIL_ADMIN_PASSWORD, EMAIL_API_URL } from '../config'

const mailService = {
    send(userName, type, email, lenderName, lenderEmail) {
        const config = {
            headers: {
                "Content-Type": "application/json"
            }
        }

        const data = {
            userName,
            type,
            email,
            lenderName,
            lenderEmail,
            subject: "Regarding loan approved",
            company: "LoanCorner PVT LTD",
            adminId: EMAIL_ADMIN_ID,
            password: EMAIL_ADMIN_PASSWORD,
        }
        axios.post(EMAIL_API_URL, data, config).then((res) => {
            return res.result.Code;
        }).catch((err) => {
            // console.log(err)
            console.log("error in sending mail to :" + email)
            return false;
        });
    }
}
export default mailService;

// {
// 	"userName":"Rishabh Singh",
// 	"type":"success",
// 	"email":"example@gmail.com",
// 	"company":"OpDevelopers PVT LTD",
// 	"adminId":"youradmin",
// 	"password":"yourpass"
// }
