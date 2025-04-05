const express = require('express');
const QRCode = require('qrcode')
const generatePayload = require('promptpay-qr')

const router = express.Router();

router.post('/', function (req, res, next) {
  const { mobileNumber = "0864108403", amount = 0.00 } = req.body
  const response = {}

  const payload = generatePayload(mobileNumber, { amount })
  const option = {
    color: {
      dark: '#000',
      light: '#fff'
    }
  }

  QRCode.toDataURL(payload, option, (err, url) => {
    if (err) {
      return res.status(400).json({
        RespCode: 400,
        RespMessage: 'bad: ' + err
      })
    } else {
      return res.status(200).json({
        RespCode: 200,
        RespMessage: 'Good',
        Result: url
      })
    }
  })
});

module.exports = router;
