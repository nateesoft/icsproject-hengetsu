const express = require('express');
const router = express.Router();

const { getAllGroup, getProductListByGroupCode } = require('../../../services/GroupFileService');

router.get('/all', function (req, res) {
  getAllGroup()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/product/:groupCode', function (req, res) {
  const { groupCode } = req.params
  getProductListByGroupCode(groupCode)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
