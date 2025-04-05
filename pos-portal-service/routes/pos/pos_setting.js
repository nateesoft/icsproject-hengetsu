const express = require('express');
const { getPosSetting, createPosSetting, updatePosSetting, getPosSettingByTerminal } = require('../../services/management/PosSettingService');
const router = express.Router();

router.get('/', function (req, res, next) {
  getPosSetting()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/', function (req, res, next) {
  createPosSetting(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.put('/', function (req, res, next) {
  updatePosSetting(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:terminalId', function (req, res, next) {
  const { terminalId } = req.params
  getPosSettingByTerminal(terminalId)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
