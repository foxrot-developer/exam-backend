const express = require('express');
const { check } = require('express-validator');

const paidExamController = require('../../controllers/user/paid-exam-controller');
const fileUpload = require('../../helpers/file-upload');

const router = express.Router();

router.get('/', paidExamController.getPaidExam);

router.post('/add-paid-exam', [
    check('name').not().isEmpty(),
    check('description').not().isEmpty()
], paidExamController.addPaidExam);

router.post('/add-paid-exam-question', fileUpload.single('questionImage'),
    [
        check('question').not().isEmpty(),
        check('answer').not().isEmpty(),
        check('options').not().isEmpty(),
        check('part').not().isEmpty(),
        check('examId').not().isEmpty()
    ], paidExamController.addPaidExamQuestion);

router.patch('/edit-paid-exam/:examId', [
    check('name').not().isEmpty(),
    check('description').not().isEmpty()
], paidExamController.editPaidExam);

router.patch('/edit-paid-exam-question/:quesId', [
    check('question').not().isEmpty(),
    check('answer').not().isEmpty(),
    check('options').not().isEmpty(),
    check('part').not().isEmpty(),
], paidExamController.editPaidExamQuestion);

router.delete('/delete-paid-exam/:examId', paidExamController.deletePaidExam);

router.delete('/delete-paid-exam-question/:quesId', paidExamController.deletePaidExamQuestion);


module.exports = router;