const express = require('express');
const router = express.Router();

const { getTableInfo, createData, updateData, getLastTableCheckIn } = require('../../services/management/TableCheckIn');

router.get('/:tableNo', function (req, res, next) {
  const { tableNo } = req.params
  getTableInfo(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:tableNo/lastCheckIn', function (req, res, next) {
  const { tableNo } = req.params
  getLastTableCheckIn(tableNo)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/:tableNo', function (req, res, next) {
  const { tableNo } = req.params
  createData(tableNo, req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.put('/:tableNo', function (req, res, next) {
  const { tableNo } = req.params
  updateData(tableNo, req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
