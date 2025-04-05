const express = require('express');
const router = express.Router();

const MemberMasterService = require('../../../services/member/crm/MemberMasterService')

router.get('/', function (req, res) {
  MemberMasterService.getData()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/search', function (req, res) {
  const {phone, code, name} = req.body
  const phoneFormat = phone.replace('-', '')
  MemberMasterService.searchData(phoneFormat, code, name)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:Member_Code', function (req, res) {
  const { Member_Code } = req.params
  MemberMasterService.getDataByMemberCode(Member_Code)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
