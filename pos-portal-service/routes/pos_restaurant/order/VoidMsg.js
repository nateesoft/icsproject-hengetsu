const express = require('express');
const router = express.Router();

const VoidMsgService = require('../../../services/VoidMsgService')

router.get('/', (req, res) => {
  VoidMsgService.getVoidMsg()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
