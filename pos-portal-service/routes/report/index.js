const express = require('express');
const router = express.Router();

const { getTableOnAction, getTableOnActionList, getTerminalByMacno, getTerminalByCashier, getGroupPlu, getPluCode, getHourlyReport, getCustomerPerHour, getReceipt, getVoidBill, getCreditPayment, getTopSale, getPromotion, getSpecialCupon } = require('../../services/ReportService');

router.get('/', async (req, res) => {
  res.send('Success')
});

router.get('/table-on-action', async (req, res) => {
  const { date } = req.body
  getTableOnAction(date)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/table-on-action/list', async (req, res) => {
  getTableOnActionList()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/terminal-report', async (req, res) => {
  const { macno } = req.body
  getTerminalByMacno(macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/cashier-report', async (req, res) => {
  const { cashier } = req.body
  getTerminalByCashier(cashier)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/group-plu-report', async (req, res) => {
  const { macno1, macno2, cashier1, cashier2, group1, group2 } = req.body
  getGroupPlu(macno1, macno2, cashier1, cashier2, group1, group2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/plu-report', async (req, res) => {
  const { macno1, macno2, cashier1, cashier2, group1, group2, pluCode } = req.body
  getPluCode(macno1, macno2, cashier1, cashier2, group1, group2, pluCode)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/customer-per-hour-report', async (req, res) => {
  const { macno1, macno2 } = req.body
  getCustomerPerHour(macno1, macno2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/hourly-report', async (req, res) => {
  const { macno1, macno2 } = req.body
  getHourlyReport(macno1, macno2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/receipt-report', async (req, res) => {
  const { macno1, macno2 } = req.body
  getReceipt(macno1, macno2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/void-report', async (req, res) => {
  const { macno1, macno2, cashier1, cashier2 } = req.body
  getVoidBill(macno1, macno2, cashier1, cashier2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/credit-report', async (req, res) => {
  const { macno1, macno2, cashier1, cashier2 } = req.body
  getCreditPayment(macno1, macno2, cashier1, cashier2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/top-sale-report', async (req, res) => {
  const { macno1, macno2, cashier1, cashier2, group1, group2 } = req.body
  getTopSale(macno1, macno2, cashier1, cashier2, group1, group2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/promotion-report', async (req, res) => {
  const { macno } = req.body
  getPromotion(macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/special-cupon-report', async (req, res) => {
  const { macno } = req.body
  getSpecialCupon(macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
