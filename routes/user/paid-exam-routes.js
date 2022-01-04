const express = require('express');
const { check } = require('express-validator');

const paidExamController = require('../../controllers/user/paid-exam-controller');
const fileUpload = require('../../helpers/file-upload');

const router = express.Router();

router.get('/', paidExamController.getPaidExam);

router.get('/all-paid-questions', paidExamController.allPaidQuestions);

router.get('/all-exam-results', paidExamController.allExamResults);

router.get('/exam-details/:examId', paidExamController.paidExamDetails);

router.get('/user-results/:userId', paidExamController.userResults);

router.post('/exam-result/:userId', [
    check('examId').not().isEmpty(),
    check('answers').not().isEmpty().isArray({ min: 1 })
], paidExamController.paidExamResult);

router.post('/add-paid-exam', [
    check('name').not().isEmpty(),
    check('name_ar').not().isEmpty(),
    check('name_nl').not().isEmpty(),
    check('description').not().isEmpty(),
    check('description_ar').not().isEmpty(),
    check('description_nl').not().isEmpty()
], paidExamController.addPaidExam);

router.post('/add-paid-exam-question', fileUpload.single('questionImage'),
    [
        check('question').not().isEmpty(),
        check('question_ar').not().isEmpty(),
        check('question_nl').not().isEmpty(),
        check('answer').not().isEmpty(),
        check('answer_ar').not().isEmpty(),
        check('answer_nl').not().isEmpty(),
        check('draggable').not().isEmpty().isBoolean(),
        check('options').not().isEmpty(),
        check('options_ar').not().isEmpty(),
        check('options_nl').not().isEmpty(),
        check('part').not().isEmpty(),
        check('part_ar').not().isEmpty(),
        check('part_nl').not().isEmpty(),
        check('reason').not().isEmpty(),
        check('reason_ar').not().isEmpty(),
        check('reason_nl').not().isEmpty(),
    ], paidExamController.addPaidExamQuestion);

router.post('/approve-questions', fileUpload.fields([{ name: 'questionImages', maxCount: 100 }]),
    [
        check('questions').not().isEmpty(),
    ], paidExamController.approveQuestions);

router.patch('/edit-paid-exam/:examId', [
    check('name').not().isEmpty(),
    check('name_ar').not().isEmpty(),
    check('name_nl').not().isEmpty(),
    check('description').not().isEmpty(),
    check('description_ar').not().isEmpty(),
    check('description_nl').not().isEmpty()
], paidExamController.editPaidExam);

router.patch('/edit-paid-exam-question/:quesId', fileUpload.single('questionImage'), [
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
], paidExamController.editPaidExamQuestion);

router.delete('/delete-paid-exam/:examId', paidExamController.deletePaidExam);

router.delete('/delete-paid-exam-question/:quesId', paidExamController.deletePaidExamQuestion);


module.exports = router;