const express = require('express');
const router = express.Router();

const { getTempGiftList, getTGiftList, createTempGift, createTGift, deleteTempGiftByGiftNo } = require('../../../services/TGiftService');

router.get('/temp/:tableNo', (req, res) => {
  const { tableNo } = req.params
  getTempGiftList(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/temp/:tableNo/delete', (req, res) => {
  const { macno, giftno, tableNo } = req.body
  deleteTempGiftByGiftNo(macno, giftno, tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/temp', (req, res) => {
  createTempGift(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/bill/:refno', (req, res) => {
  const { refno } = req.params
  getTGiftList(refno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/bill', (req, res) => {
  createTGift(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
