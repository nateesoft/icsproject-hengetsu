const express = require('express');
const router = express.Router();

const {
  getAllBalance,
  orderStockOut,
  emptyTableBalance,
  deleteBalanceOnly,
  updatePrint2Kic,
  updateBalanceQty,
  getVoidMsgList,
  getBalanceByTableNo,
  getTotalBalance,
  addBalance,
  voidMenuBalance,
  addListBalance,
  getBalanceGroupProduct,
  updateBalanceDetail,
  voidListMenuBalanceAll,
  getSubProductByPluCode,
  updateChangeTypeMenu
} = require('../../../services/BalanceService')
const { getBalanceByRIndex, getBalanceMaxIndex, summaryBalance } = require('../../../services/CoreService')

router.get('/', (req, res) => {
  getAllBalance()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/summaryBalance', (req, res) => {
  const { tableNo, macno } = req.body
  summaryBalance(tableNo, macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

// order adjust stock
router.post('/stock-out', (req, res) => {
  const { R_Index } = req.body
  orderStockOut(R_Index)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.delete('/empty/:tableNo', (req, res) => {
  const tableNo = req.params.tableNo
  emptyTableBalance(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/delete', (req, res) => {
  const { R_Index } = req.body
  deleteBalanceOnly(R_Index)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.patch('/printToKic/:tableNo', (req, res) => {
  const tableNo = req.params.tableNo
  updatePrint2Kic(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.patch('/updateQty', (req, res) => {
  const { tableNo, rIndex, qty } = req.body
  updateBalanceQty(tableNo, rIndex, qty)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.patch('/updateChangeType', (req, res) => {
  const { R_Table, R_ETD, macno, R_Index } = req.body
  updateChangeTypeMenu(R_Table, R_ETD, macno, R_Index)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/void-msg-list', function (req, res) {
  getVoidMsgList()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:tableNo', function (req, res) {
  const tableNo = req.params.tableNo
  getBalanceByTableNo(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:tableNo/groupProduct', function (req, res) {
  const tableNo = req.params.tableNo
  getBalanceGroupProduct(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/totalBalance/:tableNo', function (req, res) {
  const tableNo = req.params.tableNo
  getTotalBalance(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/getMaxIndex/:tableNo', function (req, res) {
  const tableNo = req.params.tableNo
  getBalanceMaxIndex(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

// add new menu in balance
router.post('/', (req, res) => {
  if (Object.keys(req.body).length === 0) {
    throw new Error("Payload Information Notfound !!!")
  }
  addBalance(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

// void or refund menu in balance
router.post('/void', (req, res) => {
  voidMenuBalance(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/voidList', (req, res) => {
  voidListMenuBalanceAll(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/getData', (req, res) => {
  if (Object.keys(req.body).length === 0) {
    throw new Error("Payload Information Notfound !!!")
  }
  const { R_Index } = req.body
  getBalanceByRIndex(R_Index)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/addList', function (req, res) {
  addListBalance(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/getSubProduct', function (req, res) {
  const { tableNo, rLinkIndex } = req.body
  getSubProductByPluCode({ tableNo, rLinkIndex })
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.put('/', function (req, res) {
  const id = req.params.id
  updateBalanceDetail(req.body, id)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
})

module.exports = router;
