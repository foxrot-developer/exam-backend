const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../../helpers/http-error');
const PaidExam = require('../../models/paid-exam');
const PaidExamQuestion = require('../../models/paid-exam-question');

const getPaidExam = async (req, res, next) => {
    let allPaidQuestion;
    try {
        allPaidQuestion = await PaidExam.find({});
    } catch (error) {
        return next(new HttpError('Error fetching questions', 500));
    }

    if (!allPaidQuestion || allPaidQuestion.length === 0) {
        return next(new HttpError('No paid exams found', 500));
    }

    res.json({ questions: allPaidQuestion.map(question => question.toObject({ getters: true })) });
};

const addPaidExam = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { name, description } = req.body;

    let existingPaidExam;
    try {
        existingPaidExam = await PaidExam.findOne({ name: name });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    }

    if (existingPaidExam) {
        return next(new HttpError('Exam already exists', 422));
    }

    const newPaidExam = new PaidExam({
        name,
        description
    });

    try {
        await newPaidExam.save();
    } catch (error) {
        return next(new HttpError('Error saving paid exam to database', 500));
    };

    res.status(201).json({ paidExamId: newPaidExam.id, paidExamName: newPaidExam.name, paidExamDescription: newPaidExam.description });
};

const editPaidExam = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const examId = req.params.examId;
    const { name, description } = req.body;

    let existingPaidExam;
    try {
        existingPaidExam = await PaidExam.findById(examId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    }

    if (!existingPaidExam) {
        return next(new HttpError('Exam not found', 422));
    }

    existingPaidExam.name = name;
    existingPaidExam.description = description;

    try {
        await existingPaidExam.save();
    } catch (error) {
        return next(new HttpError('Error updating paid exam to database', 500));
    };

    res.status(201).json({ message: 'Paid exam updated successfully' });
};

const addPaidExamQuestion = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const { question, answer, options, part, examId } = req.body;

    console.log(req.file);

    let existingPaidExam;
    try {
        existingPaidExam = await PaidExam.findById(examId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching paid exam from database', 500));
    };

    if (!existingPaidExam) {
        return next(new HttpError('No paid exam found against id', 422));
    }

    const paidQuestion = new PaidExamQuestion({
        question,
        questionImage: req.file.questionImage.path,
        answer,
        options,
        part,
        examid
    });

    try {
        await paidQuestion.save();
    } catch (error) {
        return next(new HttpError('Error saving paid question', 422));
    }

    res.status(201).json({ message: 'Question added successfully' });
};

const deletePaidExam = async (req, res, next) => {
    const examId = req.params.examId;

    try {
        await PaidExamQuestion.remove({ examid: examId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error deleting paid questions from database', 500));
    };

    let existingPaidExam;
    try {
        existingPaidExam = await PaidExam.findById(examId);
    } catch (error) {
        return next(new HttpError('Error fetching paid exam from database', 500));
    };

    if (!existingPaidExam) {
        return next(new HttpError('No exam id found', 422));
    }

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await PaidExamQuestion.remove({ examid: examId });
        await existingPaidExam.remove();
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error deleting data', 500));
    }

    res.json({ message: 'Exam deleted successfully' });
};

const editPaidExamQuestion = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { question, answer, options, part } = req.body;
    const quesId = req.params.quesId;

    let existingQuestion;
    try {
        existingQuestion = await PaidExamQuestion.findById(quesId);
    } catch (error) {
        return next(new HttpError('Error fetching paid question from database', 500));
    };

    if (!existingQuestion) {
        return next(new HttpError('No paid question found against id', 422));
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

const deletePaidExamQuestion = async (req, res, next) => {
    const quesId = req.params.quesId;
    let existingQuestion;
    try {
        existingQuestion = await PaidExamQuestion.findById(quesId);
    } catch (error) {
        return next(new HttpError('Error fetching paid question from database', 500));
    };

    if (!existingQuestion) {
        return next(new HttpError('No paid question found against id', 422));
    }

    try {
        await existingQuestion.remove();
    } catch (error) {
        return next(new HttpError('Error updating question', 500));
    };

    res.json({ message: 'Question deleted successfully' });

};

exports.getPaidExam = getPaidExam;
exports.addPaidExam = addPaidExam;
exports.editPaidExam = editPaidExam;
exports.addPaidExamQuestion = addPaidExamQuestion;
exports.deletePaidExam = deletePaidExam;
exports.editPaidExamQuestion = editPaidExamQuestion;
exports.deletePaidExamQuestion = deletePaidExamQuestion;