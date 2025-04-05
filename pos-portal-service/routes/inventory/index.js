const express = require('express');
const router = express.Router();

const { getTableData, getTableColumn } = require('../../services/inventory/TableService');

router.get('/column/:tableName', (req, res, next) => {
  const { tableName } = req.params
  getTableColumn(tableName)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:tableName', (req, res, next) => {
  const { tableName } = req.params
  getTableData(tableName)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
