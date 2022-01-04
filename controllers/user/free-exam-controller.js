const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../../helpers/http-error');
const FreeExam = require('../../models/free-exam');
const NlFreeExam = require('../../models/nl-free-exam');
const ArFreeExam = require('../../models/ar-free-exam');
const PaidExam = require('../../models/paid-exam');
const ArPaidExam = require('../../models/ar-paid-exam');
const NlPaidExam = require('../../models/nl-paid-exam');
const QuestionAllocation = require('../../models/question-allocation');
const ArQuestionAllocation = require('../../models/ar-question-allocation');
const NlQuestionAllocation = require('../../models/nl-question-allocation');

const getFreeExam = async (req, res, next) => {
    if (req.headers.lang === 'en') {
        let existingFreeExam;
        try {
            existingFreeExam = await FreeExam.find({});
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        }

        if (!existingFreeExam || existingFreeExam.length === 0) {
            return next(new HttpError('No free exams found', 422));
        }

        let existingPaidExam;
        try {
            existingPaidExam = await PaidExam.findById(existingFreeExam[0].examId);
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching paid exam from database', 500));
        }

        if (!existingPaidExam) {
            return next(new HttpError('no paid exam found', 422));
        }

        res.json({ free_exam: existingPaidExam.toObject({ getters: true }), free_questions: existingFreeExam.toObject({ getters: true }) });
    }
    else if (req.headers.lang === 'ar') {
        let existingArFreeExam;
        try {
            existingArFreeExam = await FreeExam.find({});
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        }

        if (!existingArFreeExam || existingArFreeExam.length === 0) {
            return next(new HttpError('No free exams found', 422));
        }

        let existingArPaidExam;
        try {
            existingArPaidExam = await ArPaidExam.findById(existingArFreeExam[0].examId);
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching paid exam from database', 500));
        }

        if (!existingArPaidExam) {
            return next(new HttpError('no paid exam found', 422));
        }

        res.json({ free_exam: existingArPaidExam.toObject({ getters: true }), free_questions: existingArFreeExam.toObject({ getters: true }) });
    }
    else if (req.headers.lang === 'nl') {
        let existingNlFreeExam;
        try {
            existingNlFreeExam = await FreeExam.find({});
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        }

        if (!existingNlFreeExam || existingNlFreeExam.length === 0) {
            return next(new HttpError('No free exams found', 422));
        }

        let existingNlPaidExam;
        try {
            existingNlPaidExam = await NlPaidExam.findById(existingNlFreeExam[0].examId);
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching paid exam from database', 500));
        }

        if (!existingNlPaidExam) {
            return next(new HttpError('no paid exam found', 422));
        }

        res.json({ free_exam: existingNlPaidExam.toObject({ getters: true }), free_questions: existingNlFreeExam.toObject({ getters: true }) });
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

                console.log({ answerId1, answerId2, answerId3 });

                if (originalId2 && originalId3 && originalId1.x === answerId1.x && originalId1.y === answerId1.y && originalId2.x === answerId2.x && originalId3.x === answerId3.x && originalId3.y === answerId3.y) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else if (originalId2 && originalId1.x === answerId1.x && originalId1.y === answerId1.y && originalId2.x === answerId2.x) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else if (originalId1.x === answerId1.x && originalId1.y === answerId1.y) {
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

                if (originalId2 && originalId3 && originalId1.x === answerId1.x && originalId1.y === answerId1.y && originalId2.x === answerId2.x && originalId3.x === answerId3.x && originalId3.y === answerId3.y) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else if (originalId2 && originalId1.x === answerId1.x && originalId1.y === answerId1.y && originalId2.x === answerId2.x) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else if (originalId1.x === answerId1.x && originalId1.y === answerId1.y) {
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

                if (originalId2 && originalId3 && originalId1.x === answerId1.x && originalId1.y === answerId1.y && originalId2.x === answerId2.x && originalId3.x === answerId3.x && originalId3.y === answerId3.y) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else if (originalId2 && originalId1.x === answerId1.x && originalId1.y === answerId1.y && originalId2.x === answerId2.x) {
                    return {
                        id: answer.id,
                        status: true,
                        correct_answer: finalAnswers.answer
                    };
                }
                else if (originalId1.x === answerId1.x && originalId1.y === answerId1.y) {
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
        part_nl,
        reason,
        reason_ar,
        reason_nl } = req.body;

    console.log(req.file);

    const questions = new FreeExam({
        question,
        questionImage: req.file.path,
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
        questionImage: req.file.path,
        answer: answer_ar,
        options: options_ar,
        reason: reason_ar,
        part: part_ar
    });

    const nlQuestions = new NlFreeExam({
        enId: questions.id,
        question: question_nl,
        draggable,
        questionImage: req.file.path,
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
        part_nl,
        reason,
        reason_ar,
        reason_nl } = req.body;

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
    existingQuestion.reason = reason;
    existingQuestion.part = part;

    existingArQuestion.question = question_ar;
    existingArQuestion.answer = answer_ar;
    existingArQuestion.options = options_ar;
    existingArQuestion.reason = reason_ar;
    existingArQuestion.part = part_ar;

    existingNlQuestion.question = question_nl;
    existingNlQuestion.answer = answer_nl;
    existingNlQuestion.options = options_nl;
    existingNlQuestion.reason = reason_nl;
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

    console.log("Question Images", req.files.questionImages);

    const parsedQuestions = JSON.parse(questions);

    parsedQuestions.map(async (ques, index) => {

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

const selectFreeExam = async (req, res, next) => {
    const examId = req.params.examId;

    // English allocations
    let existingQuestionsAllocation
    try {
        existingQuestionsAllocation = await QuestionAllocation.findOne({ examId: examId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    }

    if (!existingQuestionsAllocation) {
        return next(new HttpError('No question allocations found against exam id', 422));
    }

    // Ar allocations
    let existingArQuestionsAllocation
    try {
        existingArQuestionsAllocation = await ArQuestionAllocation.findOne({ enId: examId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    }

    if (!existingArQuestionsAllocation) {
        return next(new HttpError('No ar question allocations found against exam id', 422));
    }

    // Nl allocations
    let existingNlQuestionsAllocation
    try {
        existingNlQuestionsAllocation = await NlQuestionAllocation.findOne({ enId: examId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    }

    if (!existingNlQuestionsAllocation) {
        return next(new HttpError('No ar question allocations found against exam id', 422));
    }

    // Free Exam
    let existingFreeExam;
    try {
        existingFreeExam = await FreeExam.find({});
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching free exam from database', 500));
    }

    // Ar Free Exam
    let existingArFreeExam;
    try {
        existingArFreeExam = await ArFreeExam.find({});
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching free exam from database', 500));
    }

    // Nl Free Exam
    let existingNlFreeExam;
    try {
        existingNlFreeExam = await ArFreeExam.find({});
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching free exam from database', 500));
    }

    if (existingFreeExam.length && existingArFreeExam.length && existingNlFreeExam.length) {
        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await existingFreeExam[0].remove({ session: session });
            await existingArFreeExam[0].remove({ session: session });
            await existingNlFreeExam[0].remove({ session: session });
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error deleting existing free exams', 422));
        }
    }

    const newFreeExam = new FreeExam({
        examId: existingQuestionsAllocation.examId,
        part1: existingQuestionsAllocation.part1,
        part2: existingQuestionsAllocation.part2,
        part3: existingQuestionsAllocation.part3
    });

    const newArFreeExam = new ArFreeExam({
        enId: newFreeExam.id,
        examId: existingArQuestionsAllocation.examId,
        part1: existingArQuestionsAllocation.part1,
        part2: existingArQuestionsAllocation.part2,
        part3: existingArQuestionsAllocation.part3
    });

    const newNlFreeExam = new ArFreeExam({
        enId: newFreeExam.id,
        examId: existingNlQuestionsAllocation.examId,
        part1: existingNlQuestionsAllocation.part1,
        part2: existingNlQuestionsAllocation.part2,
        part3: existingNlQuestionsAllocation.part3
    });

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await newFreeExam.save({ session: session });
        await newArFreeExam.save({ session: session });
        await newNlFreeExam.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error allocating exam', 422));
    }

    res.json({ message: 'Free exam allocation successful' });
};

exports.getFreeExam = getFreeExam;
exports.freeExamScore = freeExamScore;
exports.createFreeExam = createFreeExam;
exports.editQuestion = editQuestion;
exports.deleteQuestion = deleteQuestion;
exports.approveQuestions = approveQuestions;
exports.selectFreeExam = selectFreeExam;