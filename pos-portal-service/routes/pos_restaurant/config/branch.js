const express = require('express');
const router = express.Router();

const { getBranch, getAllBranch } = require('../../../services/BranchService');

router.get('/', (req, res) => {
  getBranch()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/all', (req, res) => {
  getAllBranch()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
