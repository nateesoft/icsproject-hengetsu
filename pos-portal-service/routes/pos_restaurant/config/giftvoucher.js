const express = require('express');
const router = express.Router();

const { getTempGiftList, getTGiftList, createTempGift, createTGift, deleteTempGiftByGiftNo } = require('../../../services/TGiftService');

router.get('/temp/:macno', (req, res) => {
  const { macno } = req.params
  getTempGiftList(macno)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/temp/:macno/delete', (req, res) => {
  const { macno, giftno } = req.body
  deleteTempGiftByGiftNo(macno, giftno)
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
