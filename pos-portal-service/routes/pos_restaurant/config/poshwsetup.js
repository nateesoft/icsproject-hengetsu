const express = require('express');
const router = express.Router();

const { updateNextBillNo, getAllData, getBillNoByMacno, getAllTerminal } = require('../../../services/PosHwSetup');

router.get('/', (req, res) => {
  getAllData()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/all', (req, res) => {
  getAllTerminal()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:macno', (req, res) => {
  const { macno } = req.params
  getBillNoByMacno(macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.patch('/:macno', (req, res) => {
  const { macno } = req.params
  updateNextBillNo(macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: "update next billno success" })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
})

module.exports = router;
