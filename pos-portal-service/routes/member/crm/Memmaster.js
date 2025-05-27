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

router.get('/report/all-member', function (req, res) {
  const { branch1, branch2 } = req.query
  MemberMasterService.getReportAll(branch1, branch2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/report/new-register', function (req, res) {
  const { branch1, branch2, date1, date2 } = req.params
  MemberMasterService.getReportNewRegister(branch1, branch2, date1, date2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/report/not-come', function (req, res) {
  const { branch1, branch2, date1, date2 } = req.params
  MemberMasterService.getReportNotCome(branch1, branch2, date1, date2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/report/first-check-in', function (req, res) {
  const { branch1, branch2, date1, date2 } = req.params
  MemberMasterService.getReportFirstCheckIn(branch1, branch2, date1, date2)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
