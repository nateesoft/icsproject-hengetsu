const express = require('express');
const router = express.Router();

const { TOPIC_NAME } = require('../../config/kafka/constants');
const { printTest, printReceiptProcess } = require('../../services/PrinterService');
const { getBillNoByRefno } = require('../../services/BillNoService');
const { getPOSConfigSetup } = require('../../services/CoreService');
const { getDataByMacno } = require('../../services/PosHwSetup');
const { getTCreditList } = require('../../services/TCreditService');
const { getAllTSaleByRefno } = require('../../services/TSaleService');
const { getDataByMemberCode } = require('../../services/member/crm/MemberMasterService');

module.exports = args => {

  router.post('/print-test', (req, res) => {
    const config = req.body
    printTest(config)
    res.status(200).json({
      status: "Ok!",
      message: `Send data to print test`,
    });
  })

  router.post('/createTopic', async (req, res) => {
    const { topicName = TOPIC_NAME } = req.body
    res.status(200).json({
      status: "Ok!",
      message: `Create topic ${topicName} success.`,
    });
  })

  router.post('/send', async (req, res) => {
    try {
      const { message, topicName = TOPIC_NAME } = req.body;
      const messages = [{ key: "key1", value: message }];

      try {
        await producer.connect();
        await producer.send({
          topic: topicName,
          messages: messages,
          partition: 0
        });
      } catch (error) {
        console.error(error);
      } finally {
        await producer.disconnect();
      }

      res.status(200).json({
        status: "Ok!",
        message: "Message successfully send!",
      });
    } catch (error) {
      console.log(error);
    }
  });

  router.post('/print-receipt', async (req, res) => {
    const { config, billNo, macno, printType } = req.body
    const billData = await getBillNoByRefno(billNo)
    const posConfigSetup = await getPOSConfigSetup()
    const poshwSetup = await getDataByMacno(macno)
    const creditList = await getTCreditList(billNo)
    const tSale = await getAllTSaleByRefno(billNo)
    let memberInfo = null
    if (billData.B_MemCode) {
      memberInfo = await getDataByMemberCode(billData.B_MemCode)
    }

    printReceiptProcess(config, billData, printType, posConfigSetup, poshwSetup, creditList, tSale, memberInfo)

    res.status(200).json({
      status: 2000,
      data: { billData }
    });
  })

  return router

}
