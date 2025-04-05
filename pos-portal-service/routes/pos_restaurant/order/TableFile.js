const express = require('express');
const router = express.Router();

const pool = require('../../../config/database/MySqlConnect')
const TableFileService = require('../../../services/TableFileService')

router.post('/splitBill', function (req, res) {
  const { sourceTable, targetTable, orderListToMove, macno } = req.body
  TableFileService.splitTableToPayment(sourceTable, targetTable, orderListToMove, macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/moveTable', function (req, res) {
  const { sourceTable, targetTable, admin, Cashier } = req.body
  TableFileService.tableMoveOrGroup(sourceTable, targetTable, admin, Cashier)
    .then(rows => {
      if (rows.invalid) {
        res.status(200).json({ status: 4000, error: rows.message })
      } else {
        res.status(200).json({ status: 2000, data: rows })
      }
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/tableStatus', function (req, res) {
  const { tableNo } = req.body
  TableFileService.getCheckTableStatus(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:tableNo', function (req, res) {
  const { tableNo } = req.params
  TableFileService.getTableByCode(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/list/:tableNo', function (req, res) {
  const { tableNo } = req.params
  TableFileService.getListTableByCode(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/checkTableOpen', function (req, res) {
  const { tableNo } = req.body
  TableFileService.checkTableOpen(tableNo)
    .then(rows => {
      if (rows === null) {
        return res.status(200).json({
          status: 2000,
          data: {
            tableStatus: "available",
            table: {},
            tableList: []
          }
        })
      } else {
        res.status(200).json({
          status: 2000,
          data: {
            tableStatus: "cashierInUse",
            Cashier: rows.table.Cashier,
            Employ: rows.table.TUser,
            table: rows.table,
            tableList: rows.tableList
          }
        })
      }
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err })
    })
});

router.patch('/updateOpenTable/:tableNo', function (req, res) {
  const { tableNo } = req.params
  const { Cashier, TUser } = req.body
  TableFileService.updateTableOpenStatus(tableNo, Cashier, TUser)
    .then(rows => {
      return res.status(200).json({
        status: 2000,
        data: { message: `update success ${rows}` }
      })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err })
    })
});

router.patch('/updateMember/:tableNo', function (req, res) {
  const { tableNo } = req.params
  const { Member_Code, Member_NameThai, Member_AppliedDate, Member_ExpiredDate } = req.body
  TableFileService.updateMember({
    Member_Code, Member_NameThai, Member_AppliedDate, Member_ExpiredDate
  }, tableNo)
    .then(rows => {
      return res.status(200).json({
        status: 2000,
        data: { message: `update success ${tableNo}` }
      })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err })
    })
});

router.put('/discountInfo/:tableNo', function (req, res) {
  TableFileService.updateTableDiscount(req.body)
    .then(rows => {
      return res.status(200).json({
        status: 2000,
        data: { 
          discounAmount: rows.discountAmount
         }
      })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err })
    })
});

router.put('/:id', function (req, res) {
  const id = req.params.id
  const { Tcode, SoneCode, TCustomer, TItem, TAmount, TOnAct, Service, ServiceAmt, EmpDiscAmt, FastDiscAmt,
    TrainDiscAmt, MemDiscAmt, SubDiscAmt, DiscBath, ProDiscAmt, SpaDiscAmt, CuponDiscAmt, ItemDiscAmt,
    MemCurAmt, Food, Drink, Product, NetTotal, PrintTotal, PrintChkBill, PrintCnt, ChkBill, ChkBillTime,
    StkCode1, StkCode2, TDesk } = req.body

  pool.query(
    `UPDATE tablefile 
      SET Tcode = ?,SoneCode = ?,TCustomer = ?,TItem = ?,TAmount = ?,TOnAct = ?,Service = ?,ServiceAmt = ?,
      EmpDiscAmt = ?,FastDiscAmt = ?,TrainDiscAmt = ?,MemDiscAmt = ?,SubDiscAmt = ?,DiscBath = ?,ProDiscAmt = ?,
      SpaDiscAmt = ?,CuponDiscAmt = ?,ItemDiscAmt = ?,MemCurAmt = ?,Food = ?,Drink = ?,Product = ?,NetTotal = ?,
      PrintTotal = ?,PrintChkBill = ?,PrintCnt = ?,ChkBill = ?,ChkBillTime = ?,StkCode1 = ?,StkCode2 = ?,TDesk = ? 
      WHERE id = ?`,
    [Tcode, SoneCode, TCustomer, TItem, TAmount, TOnAct, Service, ServiceAmt, EmpDiscAmt, FastDiscAmt,
      TrainDiscAmt, MemDiscAmt, SubDiscAmt, DiscBath, ProDiscAmt, SpaDiscAmt, CuponDiscAmt, ItemDiscAmt,
      MemCurAmt, Food, Drink, Product, NetTotal, PrintTotal, PrintChkBill, PrintCnt, ChkBill, ChkBillTime,
      StkCode1, StkCode2, TDesk, id],
    (err, results) => {
      if (err) throw err

      res.status(200).json({ status: "update success" })
    }
  )
})

module.exports = router;
