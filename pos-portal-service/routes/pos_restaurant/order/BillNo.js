const express = require('express');
const router = express.Router();

const BillNoService = require('../../../services/BillNoService')

router.get('/', function (req, res) {
  BillNoService.getAllBillNoToday()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:billNo', function (req, res) {
  const { billNo } = req.params
  BillNoService.getBillNoByRefno(billNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

// create new billno
router.post('/', (req, res) => {
  BillNoService.addNewBill(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

// search data
router.post('/search', function (req, res) {
  const { billNo, postDate, macno } = req.body
  BillNoService.searchBillNoCondition(billNo, postDate, macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

// refund bill
router.post('/refund', (req, res) => {
  const { billNo, Cashier, macno } = req.body
  BillNoService.billRefundStockIn(billNo, Cashier, macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

// print copy bill
router.post('/billCopy', (req, res) => {
  const { billNo, Cashier, macno, copy } = req.body
  BillNoService.printCopyBill(billNo, Cashier, macno, copy)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/toBalance', function (req, res) {
  const { billRefNo, tableNo } = req.body
  BillNoService.loadBillnoToBalance(billRefNo, tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/printChkBill', function (req, res) {
  const { tableNo, macno } = req.body
  BillNoService.updateStatusPrintChkBill(tableNo, macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
