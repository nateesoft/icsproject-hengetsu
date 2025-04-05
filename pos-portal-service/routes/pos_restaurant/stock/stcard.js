const express = require('express');
const router = express.Router();

const STCardService = require('../../../services/STCardService')

router.get('/', (req, res) => {
  STCardService.getSTCard()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:S_PCode', (req, res) => {
  const { S_PCode } = req.params
  STCardService.getSTCardBySPCode(S_PCode)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
