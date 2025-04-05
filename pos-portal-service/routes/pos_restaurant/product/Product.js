const express = require('express');
const router = express.Router();

const { getAllProduct, getProductByPCode } = require('../../../services/ProductService');

router.get('/', function (req, res) {
  getAllProduct(code)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:productCode', function (req, res) {
  const { productCode } = req.params
  getProductByPCode(productCode)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
