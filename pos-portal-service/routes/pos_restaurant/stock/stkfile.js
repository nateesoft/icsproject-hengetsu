const express = require('express');
const router = express.Router();

const StkFileService = require('../../../services/StkFileService')

router.get('/', (req, res) => {
  StkFileService.getStkFile()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:BPCode', (req, res) => {
  const { BPCode } = req.params
  StkFileService.getStkFileByBPCode(BPCode)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
