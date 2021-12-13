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
        check('answer_ar').not().isEmpty(),
        check('answer_nl').not().isEmpty(),
        check('options').not().isEmpty(),
        check('options_ar').not().isEmpty(),
        check('options_nl').not().isEmpty(),
        check('part').not().isEmpty(),
        check('part_ar').not().isEmpty(),
        check('part_nl').not().isEmpty(),
    ], freeExamController.createFreeExam);

router.patch('/edit-question/:quesId', [
    check('question').not().isEmpty(),
    check('answer').not().isEmpty(),
    check('options').not().isEmpty(),
    check('part').not().isEmpty(),
], freeExamController.editQuestion);

router.delete('/delete-question/:quesId', freeExamController.deleteQuestion);

module.exports = router;