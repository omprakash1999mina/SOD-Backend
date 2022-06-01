import axios from 'axios';
import { DISCORD_URL, DISCORD_WEBHOOK_ID, DISCORD_WEBHOOK_TOKEN, DISCORD_SHOULD_WAIT_FOR_RESPONSE } from '../config';
// This service send the all errors to our discord channel by which we always monitor our server activities and prevent server crashes. 
const  discord= {
    async SendErrorMessageToDiscord (email, requestName, error){
        const url = DISCORD_URL + DISCORD_WEBHOOK_ID + "/" + DISCORD_WEBHOOK_TOKEN + "?wait=" + DISCORD_SHOULD_WAIT_FOR_RESPONSE;
        const config = {
            headers: {
                "Content-Type": "application/json"
            }
        }

        let embeds = [
            {
                footer: {
                    text: `${email}`,
                },
                fields: [
                    {
                        name: `${requestName}`,
                        value: `${error}`
                    },
                ],
            },
        ]

        const msg = JSON.stringify({ embeds });
        axios.post(url, msg, config)
            .then((res) => {
                console.log(res.status)
                return res.status;
            })
            .catch((err) => {
                console.log("error in sending error to discord")
                return err;
            })
    }
}

export default discord;