const express = require('express');
const { check } = require('express-validator');

const freeExamController = require('../../controllers/user/free-exam-controller');

const router = express.Router();

router.get('/', freeExamController.getFreeExam);

router.post('/exam-score', [
    check('answers').not().isEmpty().isArray({ min: 1 })
], freeExamController.freeExamScore);

router.post('/create-free-exam', [
    check('question').not().isEmpty(),
    check('answer').not().isEmpty(),
    check('options').not().isEmpty().isArray({ min: 1 }),
    check('part').not().isEmpty(),
], freeExamController.createFreeExam);

router.patch('/edit-question/:quesId', [
    check('question').not().isEmpty(),
    check('answer').not().isEmpty(),
    check('options').not().isEmpty().isArray({ min: 1 }),
    check('part').not().isEmpty(),
], freeExamController.editQuestion);

router.delete('/delete-question/:quesId', freeExamController.deleteQuestion);

module.exports = router;