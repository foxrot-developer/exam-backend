const { validationResult } = require('express-validator');
const { Promise } = require('mongoose');

const HttpError = require('../../helpers/http-error');
const FreeExam = require('../../models/free-exam');

const getFreeExam = async (req, res, next) => {
    let allFreeQuestion;
    try {
        allFreeQuestion = await FreeExam.find({}, '-answer');
    } catch (error) {
        return next(new HttpError('Error fetching questions', 500));
    }

    if (!allFreeQuestion || allFreeQuestion.length === 0) {
        return next(new HttpError('No questions found', 500));
    }

    // const questions = new FreeExam({
    //     question: 'If you drive at 20. Whay should you do?',
    //     answer: 'speed up',
    //     options: ['slow down', 'speed up', 'nothing']
    // });

    // try {
    //     await questions.save();
    // } catch(error) {
    //     return next(new HttpError('Error', 422));
    // }
    // res.send('ok');

    res.json({ questions: allFreeQuestion.map(question => question.toObject({ getters: true })) });
};

const freeExamScore = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { answers } = req.body;

    const questionAnswers = answers.map(async answer => {
        if (!answer.id) {
            return next(new HttpError('Question id is required', 422));
        }
        const finalAnswers = await FreeExam.findById(answer.id);
        if (answer.answer === finalAnswers.answer) {
            return {
                id: answer.id,
                status: true
            };
        }
        else {
            return {
                id: answer.id,
                status: false
            };
        }
    })
    const results = await Promise.all(questionAnswers);
    res.json({ results });
};

const createFreeExam = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { question, answer, options, part } = req.body;

    const questions = new FreeExam({
        question,
        answer,
        options,
        part
    });

    try {
        await questions.save();
    } catch (error) {
        return next(new HttpError('Error saving question', 422));
    }

    res.status(201).json({ message: 'Question added successfully' });
};

const editQuestion = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { question, answer, options, part } = req.body;
    const quesId = req.params.quesId;

    let existingQuestion;
    try {
        existingQuestion = await FreeExam.findById(quesId);
    } catch (error) {
        return next(new HttpError('Error fetching question from database', 500));
    };

    if (!existingQuestion) {
        return next(new HttpError('No question found against id', 422));
    }

    existingQuestion.question = question;
    existingQuestion.answer = answer;
    existingQuestion.options = options;
    existingQuestion.part = part;

    try {
        await existingQuestion.save();
    } catch (error) {
        return next(new HttpError('Error updating question', 500));
    };

    res.json({ message: 'Question updated successfully' });
};

const deleteQuestion = async (req, res, next) => {
    const quesId = req.params.quesId;

    let existingQuestion;
    try {
        existingQuestion = await FreeExam.findById(quesId);
    } catch (error) {
        return next(new HttpError('Error fetching question from database', 500));
    };

    if (!existingQuestion) {
        return next(new HttpError('No question found against id', 422));
    }

    try {
        await existingQuestion.remove();
    } catch (error) {
        return next(new HttpError('Error deleting question', 500));
    };

    res.json({ message: 'Question deleted successfully' });
};

exports.getFreeExam = getFreeExam;
exports.freeExamScore = freeExamScore;
exports.createFreeExam = createFreeExam;
exports.editQuestion = editQuestion;
exports.deleteQuestion = deleteQuestion;