import { Kafka } from "@upstash/kafka"
// import { Kafka, logLevel } from 'kafkajs';
import Discord from './discord';
import { KAFKA_BROKER1, KAFKA_BROKER1_URL, KAFKA_CLIENT_ID, KAFKA_MECHANISM, KAFKA_PASSWORD, KAFKA_TOPIC, KAFKA_USERNAME } from '../config';

// const kafka = new Kafka({
//     clientId: KAFKA_CLIENT_ID,
//     brokers: [KAFKA_BROKER1],
//     ssl: true,
//     sasl: {
//         mechanism: KAFKA_MECHANISM,
//         username: KAFKA_USERNAME,
//         password: KAFKA_PASSWORD
//     },
//     logLevel: logLevel.ERROR,
// });
// const producer = kafka.producer();

const KafkaService = {
    // async send(data) {
    //     let success = false;
    //     const run = async () => {
    //         // Connect the producer
    //         await producer.connect();
    //         // Produce a message
    //         await producer.send({
    //             topic: KAFKA_TOPIC,
    //             messages: [
    //                 { value: JSON.stringify(data) },
    //             ],
    //         });

    //         console.log("Message sent successfully");
    //         await producer.disconnect();
    //         console.log("Kafka Disconnected");
    //         success = true
    //     };

    //     await run().catch(err => {
    //         console.error('Erros Kafka-Service: ', err)
    //         Discord.SendErrorMessageToDiscord("Error", "Kafka-Service", err)
    //     });

    //     return success
    // },
    async send(data) {

        const kafka = new Kafka({
            url: KAFKA_BROKER1_URL,
            username: KAFKA_USERNAME,
            password: KAFKA_PASSWORD,
        })

        const p = kafka.producer()
        // Objects will get serialized using "JSON.stringify"
        try {
            const res = await p.produce(KAFKA_TOPIC, JSON.stringify(data))
            if (!res) console.log(res)
        } catch (err) {
            console.error('Error Kafka-Service: ', err)
            Discord.SendErrorMessageToDiscord("Error", "Kafka-Service", err)
        }
        console.log("Message sent successfully");
        // return success
    }
}

export default KafkaService