const { Kafka } = require("kafkajs");
const { BROKERS, CLIENT_ID } = require("./constants.js");

const kafkaConfig = {
  clientId: CLIENT_ID,
  brokers: BROKERS,
};

const kafka = new Kafka(kafkaConfig);

module.exports = kafka;