const express = require('express');
const router = express.Router();

const { getDataCupon, saveDataCupon } = require('../../../services/CuponService');

router.get('/list', (req, res) => {
  getDataCupon()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/saveList', (req, res) => {
  saveDataCupon(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
