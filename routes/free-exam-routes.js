const express = require('express');
const { check } = require('express-validator');

const freeExamController = require('../controllers/free-exam-controller');

const router = express.Router();

router.get('/', freeExamController.getFreeExam);

router.post('/exam-score', [
    check('answers').not().isEmpty().isArray({ min: 1 })
] ,freeExamController.freeExamScore);

module.exports = router;