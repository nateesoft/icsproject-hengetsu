const express = require('express');
const router = express.Router();

const CreditFileService = require('../../../services/CreditFileService');
const { getTempCredit, createListTempCredit, deleteTempCredit, emptyTempCredit, createTempCredit, getTCreditList } = require('../../../services/TCreditService');

router.get('/', function (req, res) {
  CreditFileService.getData()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:CrCode', function (req, res) {
  const { CrCode } = req.params
  CreditFileService.getDataByCrCode(CrCode)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/temp/:macno/:tableNo', function (req, res) {
  const { macno, tableNo } = req.params
  getTempCredit(macno, tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/tcredit/:refno', function (req, res) {
  const { refno } = req.params
  getTCreditList(refno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/temp', function (req, res) {
  createTempCredit(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/temp/list', function (req, res) {
  const { payload } = req.body
  createListTempCredit(payload)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/temp/delete', function (req, res) {
  deleteTempCredit(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/temp/empty', function (req, res) {
  const { Mac_No } = req.body
  emptyTempCredit(Mac_No)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
