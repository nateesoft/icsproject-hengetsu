const express = require('express');
const router = express.Router();

const STCardService = require('../../../services/STCardService')

router.get('/', function (req, res) {
  res.status(200).send("api success")
});

router.post('/', (req, res) => {
  const { R_Index } = req.body
  if (R_Index) {
    STCardService.executeProcess(R_Index)
      .then(rows => {
        res.status(200).json({ status: 2000, data: rows })
      })
      .catch(err => {
        res.status(500).json({ status: 5000, data: null, errorMessage: err })
      })
  } else {
    res.status(200).json({ status: 5000, data: "Payload invalid to process stock" })
  }
});

module.exports = router;
