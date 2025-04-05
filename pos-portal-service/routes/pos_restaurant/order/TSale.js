const express = require('express');
const router = express.Router();

const { getAllTSale, getAllTSaleByRefno } = require('../../../services/TSaleService');

router.get('/', function (req, res) {
  getAllTSale()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:refNo', function (req, res) {
  const { refNo } = req.params
  getAllTSaleByRefno(refNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
