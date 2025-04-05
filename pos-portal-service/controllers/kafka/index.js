const { TOPIC_NAME } = require("../../config/kafka/constants.js");
const KafkaProducer = require("./producer.js");
const kafkaProducer = new KafkaProducer();

const sendMessageToKafka = async (req, res) => {
    console.log('sendMessageToKafka')
    // try {
    //     const { message } = req.body;
    //     const messages = [{ key: "key1", value: message }];
    //     kafkaProducer.produce(TOPIC_NAME, messages);

    //     res.status(200).json({
    //         status: "Ok!",
    //         message: "Message successfully send!",
    //     });
    // } catch (error) {
    //     console.log(error);
    // }
};

const constrollers = { sendMessageToKafka };

module.exports = constrollers;