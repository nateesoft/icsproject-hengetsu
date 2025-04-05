const express = require('express');
const router = express.Router();

const { getAllOptionFile, getOptionfileByProductCode } = require('../../services/OptionfileService');

/* GET all optionfile. */
router.get('/', function (req, res) {
  getAllOptionFile()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

/* GET optionfile by Product Code. */
router.get('/:productCode', function (req, res) {
  const { productCode } = req.params
  getOptionfileByProductCode(productCode)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
