const express = require('express');
const { check } = require('express-validator');

const freeExamController = require('../../controllers/user/free-exam-controller');
const fileUpload = require('../../helpers/file-upload');

const router = express.Router();

router.get('/', freeExamController.getFreeExam);

router.post('/exam-score', [
    check('answers').not().isEmpty().isArray({ min: 1 })
], freeExamController.freeExamScore);

router.post('/create-free-exam', fileUpload.single('questionImage'),
    [
        check('question').not().isEmpty(),
        check('question_ar').not().isEmpty(),
        check('question_nl').not().isEmpty(),
        check('answer').not().isEmpty(),
        check('draggable').not().isEmpty().isBoolean(),
        check('answer_ar').not().isEmpty(),
        check('answer_nl').not().isEmpty(),
        check('options').not().isEmpty(),
        check('options_ar').not().isEmpty(),
        check('options_nl').not().isEmpty(),
        check('part').not().isEmpty(),
        check('part_ar').not().isEmpty(),
        check('part_nl').not().isEmpty(),
        check('reason').not().isEmpty(),
        check('reason_ar').not().isEmpty(),
        check('reason_nl').not().isEmpty(),
    ], freeExamController.createFreeExam);

router.post('/free-approve-questions', fileUpload.fields([{ name: 'questionImages', maxCount: 100 }]),
    [
        check('questions').not().isEmpty(),
    ], freeExamController.approveQuestions);

router.post('/select-free-exam/:examId', freeExamController.selectFreeExam);

router.patch('/edit-question/:quesId', [
    check('question').not().isEmpty(),
    check('question_ar').not().isEmpty(),
    check('question_nl').not().isEmpty(),
    check('answer').not().isEmpty(),
    check('draggable').not().isEmpty().isBoolean(),
    check('answer_ar').not().isEmpty(),
    check('answer_nl').not().isEmpty(),
    check('options').not().isEmpty(),
    check('options_ar').not().isEmpty(),
    check('options_nl').not().isEmpty(),
    check('part').not().isEmpty(),
    check('part_ar').not().isEmpty(),
    check('part_nl').not().isEmpty(),
    check('reason').not().isEmpty(),
    check('reason_ar').not().isEmpty(),
    check('reason_nl').not().isEmpty(),
], freeExamController.editQuestion);

router.delete('/delete-question/:quesId', freeExamController.deleteQuestion);

module.exports = router;