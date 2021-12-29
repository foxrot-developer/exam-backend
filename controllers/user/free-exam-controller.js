const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../../helpers/http-error');
const FreeExam = require('../../models/free-exam');
const NlFreeExam = require('../../models/nl-free-exam');
const ArFreeExam = require('../../models/ar-free-exam');

const getFreeExam = async (req, res, next) => {
    if (req.headers.lang === 'en') {
        let allFreeQuestion;
        try {
            allFreeQuestion = await FreeExam.find({});
        } catch (error) {
            return next(new HttpError('Error fetching questions', 500));
        }

        if (!allFreeQuestion || allFreeQuestion.length === 0) {
            return next(new HttpError('No questions found', 500));
        }

        res.json({ questions: allFreeQuestion.map(question => question.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'ar') {
        let allArFreeQuestion;
        try {
            allArFreeQuestion = await ArFreeExam.find({});
        } catch (error) {
            return next(new HttpError('Error fetching questions', 500));
        }

        if (!allArFreeQuestion || allArFreeQuestion.length === 0) {
            return next(new HttpError('No questions found', 500));
        }

        res.json({ questions: allArFreeQuestion.map(question => question.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'nl') {
        let allNlFreeQuestion;
        try {
            allNlFreeQuestion = await NlFreeExam.find({});
        } catch (error) {
            return next(new HttpError('Error fetching questions', 500));
        }

        if (!allNlFreeQuestion || allNlFreeQuestion.length === 0) {
            return next(new HttpError('No questions found', 500));
        }

        res.json({ questions: allNlFreeQuestion.map(question => question.toObject({ getters: true })) });
    }
    else {
        res.json({ message: 'Invalid language header or no header found' });
    }
};

const freeExamScore = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { answers } = req.body;

    if (req.headers.lang === 'en') {
        const questionAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = await FreeExam.findById(answer.id);
            if (!finalAnswers.draggable) {
                if (answer.answer === finalAnswers.answer) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else {
                    return {
                        id: answer.id,
                        status: false,
                        correct_answer: finalAnswers.answer
                    };
                }
            }
            else {
                const originalId1 = JSON.parse(finalAnswers.answer).find(ans => ans.id === 1);
                const originalId2 = JSON.parse(finalAnswers.answer).find(ans => ans.id === 2);
                const originalId3 = JSON.parse(finalAnswers.answer).find(ans => ans.id === 3);

                const answerId1 = JSON.parse(answer.answer).find(ans => ans.id === 1);
                const answerId2 = JSON.parse(answer.answer).find(ans => ans.id === 2);
                const answerId3 = JSON.parse(answer.answer).find(ans => ans.id === 3);

                if (originalId1.x === answerId1.x && originalId1.y === answerId1.y && originalId2.x === answerId2.x && originalId3.x === answerId3.x && originalId3.y === answerId3.y) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else {
                    return {
                        id: answer.id,
                        status: false,
                        correct_answer: finalAnswers.answer
                    };
                }
            }
        })
        const results = await Promise.all(questionAnswers);
        res.json({ results });
    }

    else if (req.headers.lang === 'ar') {
        const questionAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = await ArFreeExam.findById(answer.id);
            if (!finalAnswers.draggable) {
                if (answer.answer === finalAnswers.answer) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else {
                    return {
                        id: answer.id,
                        status: false,
                        correct_answer: finalAnswers.answer
                    };
                }
            }
            else {
                const originalId1 = JSON.parse(finalAnswers.answer).find(ans => ans.id === 1);
                const originalId2 = JSON.parse(finalAnswers.answer).find(ans => ans.id === 2);
                const originalId3 = JSON.parse(finalAnswers.answer).find(ans => ans.id === 3);

                const answerId1 = JSON.parse(answer.answer).find(ans => ans.id === 1);
                const answerId2 = JSON.parse(answer.answer).find(ans => ans.id === 2);
                const answerId3 = JSON.parse(answer.answer).find(ans => ans.id === 3);

                if (originalId1.x === answerId1.x && originalId1.y === answerId1.y && originalId2.x === answerId2.x && originalId3.x === answerId3.x && originalId3.y === answerId3.y) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else {
                    return {
                        id: answer.id,
                        status: false,
                        correct_answer: finalAnswers.answer
                    };
                }
            }
        })
        const results = await Promise.all(questionAnswers);
        res.json({ results });
    }

    else if (req.headers.lang === 'nl') {
        const questionAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = await NlFreeExam.findById(answer.id);
            if (!finalAnswers.draggable) {
                if (answer.answer === finalAnswers.answer) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else {
                    return {
                        id: answer.id,
                        status: false,
                        correct_answer: finalAnswers.answer
                    };
                }
            }
            else {
                const originalId1 = JSON.parse(finalAnswers.answer).find(ans => ans.id === 1);
                const originalId2 = JSON.parse(finalAnswers.answer).find(ans => ans.id === 2);
                const originalId3 = JSON.parse(finalAnswers.answer).find(ans => ans.id === 3);

                const answerId1 = JSON.parse(answer.answer).find(ans => ans.id === 1);
                const answerId2 = JSON.parse(answer.answer).find(ans => ans.id === 2);
                const answerId3 = JSON.parse(answer.answer).find(ans => ans.id === 3);

                if (originalId1.x === answerId1.x && originalId1.y === answerId1.y && originalId2.x === answerId2.x && originalId3.x === answerId3.x && originalId3.y === answerId3.y) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else {
                    return {
                        id: answer.id,
                        status: false,
                        correct_answer: finalAnswers.answer
                    };
                }
            }
        })
        const results = await Promise.all(questionAnswers);
        res.json({ results });
    }
    else {
        res.json({ message: 'Invalid language header or no header found' });
    }
};

const createFreeExam = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const {
        question,
        draggable,
        question_ar,
        question_nl,
        answer,
        answer_ar,
        answer_nl,
        options,
        options_ar,
        options_nl,
        part,
        part_ar,
        part_nl, } = req.body;

    console.log(req.file);

    const questions = new FreeExam({
        question,
        questionImage: req.file.path,
        answer,
        draggable,
        options,
        part
    });

    const arQuestions = new ArFreeExam({
        enId: questions.id,
        question: question_ar,
        draggable,
        questionImage: req.file.path,
        answer: answer_ar,
        options: options_ar,
        part: part_ar
    });

    const nlQuestions = new NlFreeExam({
        enId: questions.id,
        question: question_nl,
        draggable,
        questionImage: req.file.path,
        answer: answer_nl,
        options: options_nl,
        part: part_nl
    });

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await questions.save({ session: session });
        await arQuestions.save({ session: session });
        await nlQuestions.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error saving question', 422));
    }

    res.status(201).json({ message: 'Question added successfully' });
};

const editQuestion = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const {
        question,
        question_ar,
        question_nl,
        answer,
        answer_ar,
        answer_nl,
        options,
        options_ar,
        options_nl,
        part,
        part_ar,
        part_nl, } = req.body;

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

    // Ar
    let existingArQuestion;
    try {
        existingArQuestion = await ArFreeExam.findOne({ enId: quesId });
    } catch (error) {
        return next(new HttpError('Error fetching question from database', 500));
    };

    if (!existingArQuestion) {
        return next(new HttpError('No ar question found against id', 422));
    }

    // Nl
    let existingNlQuestion;
    try {
        existingNlQuestion = await NlFreeExam.findOne({ enId: quesId });
    } catch (error) {
        return next(new HttpError('Error fetching question from database', 500));
    };

    if (!existingNlQuestion) {
        return next(new HttpError('No nl question found against id', 422));
    }

    existingQuestion.question = question;
    existingQuestion.answer = answer;
    existingQuestion.options = options;
    existingQuestion.part = part;

    existingArQuestion.question = question_ar;
    existingArQuestion.answer = answer_ar;
    existingArQuestion.options = options_ar;
    existingArQuestion.part = part_ar;

    existingNlQuestion.question = question_nl;
    existingNlQuestion.answer = answer_nl;
    existingNlQuestion.options = options_nl;
    existingNlQuestion.part = part_nl;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingQuestion.save({ session: session });
        await existingArQuestion.save({ session: session });
        await existingNlQuestion.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
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

    // Ar
    let existingArQuestion;
    try {
        existingArQuestion = await ArFreeExam.findOne({ enId: quesId });
    } catch (error) {
        return next(new HttpError('Error fetching question from database', 500));
    };

    if (!existingArQuestion) {
        return next(new HttpError('No ar question found against id', 422));
    }

    // Nl
    let existingNlQuestion;
    try {
        existingNlQuestion = await NlFreeExam.findOne({ enId: quesId });
    } catch (error) {
        return next(new HttpError('Error fetching question from database', 500));
    };

    if (!existingNlQuestion) {
        return next(new HttpError('No nl question found against id', 422));
    }

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingQuestion.remove({ session: session });
        await existingArQuestion.remove({ session: session });
        await existingNlQuestion.remove({ session: session });
        await session.commitTransaction();
    } catch (error) {
        return next(new HttpError('Error deleting question', 500));
    };

    res.json({ message: 'Question deleted successfully' });
};

const approveQuestions = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const { questions } = req.body;

    console.log(req.files.questionImages);

    const parsedQuestions = JSON.parse(questions);

    parsedQuestions.map((ques, index) => {

        const {
            question,
            draggable,
            question_ar,
            question_nl,
            answer,
            answer_ar,
            answer_nl,
            options,
            options_ar,
            options_nl,
            part,
            part_ar,
            part_nl,
            reason,
            reason_ar,
            reason_nl } = ques;

        const questions = new FreeExam({
            question,
            questionImage: req.files.questionImages[index].path,
            answer,
            draggable,
            options,
            reason,
            part
        });

        const arQuestions = new ArFreeExam({
            enId: questions.id,
            question: question_ar,
            draggable,
            questionImage: req.files.questionImages[index].path,
            answer: answer_ar,
            options: options_ar,
            reason: reason_ar,
            part: part_ar
        });

        const nlQuestions = new NlFreeExam({
            enId: questions.id,
            question: question_nl,
            draggable,
            questionImage: req.files.questionImages[index].path,
            answer: answer_nl,
            options: options_nl,
            reason: reason_nl,
            part: part_nl
        });

        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await questions.save({ session: session });
            await arQuestions.save({ session: session });
            await nlQuestions.save({ session: session });
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error saving question', 422));
        }
    });

    res.json({ message: "Questions uploaded successfully" });

};

exports.getFreeExam = getFreeExam;
exports.freeExamScore = freeExamScore;
exports.createFreeExam = createFreeExam;
exports.editQuestion = editQuestion;
exports.deleteQuestion = deleteQuestion;
exports.approveQuestions = approveQuestions;