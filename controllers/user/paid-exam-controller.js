const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../../helpers/http-error');
const PaidExam = require('../../models/paid-exam');
const ArPaidExam = require('../../models/ar-paid-exam');
const NlPaidExam = require('../../models/nl-paid-exam');
const PaidExamQuestion = require('../../models/paid-exam-question');
const ArPaidExamQuestion = require('../../models/ar-paid-exam-question');
const NlPaidExamQuestion = require('../../models/nl-paid-exam-question');
const Result = require('../../models/result');
const User = require('../../models/user');
const QuestionAllocation = require('../../models/question-allocation');
const ArQuestionAllocation = require('../../models/ar-question-allocation');
const NlQuestionAllocation = require('../../models/nl-question-allocation');

const getPaidExam = async (req, res, next) => {

    if (req.headers.lang === 'en') {
        let allPaidQuestion;
        try {
            allPaidQuestion = await PaidExam.find({});
        } catch (error) {
            return next(new HttpError('Error fetching questions', 500));
        }

        if (!allPaidQuestion || allPaidQuestion.length === 0) {
            return next(new HttpError('No paid exams found', 500));
        }

        res.json({ paid_exams: allPaidQuestion.map(question => question.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'ar') {
        let allArPaidQuestion;
        try {
            allArPaidQuestion = await ArPaidExam.find({});
        } catch (error) {
            return next(new HttpError('Error fetching questions', 500));
        }

        if (!allArPaidQuestion || allArPaidQuestion.length === 0) {
            return next(new HttpError('No paid exams found', 500));
        }

        res.json({ paid_exams: allArPaidQuestion.map(question => question.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'nl') {
        let allNlPaidQuestion;
        try {
            allNlPaidQuestion = await NlPaidExam.find({});
        } catch (error) {
            return next(new HttpError('Error fetching questions', 500));
        }

        if (!allNlPaidQuestion || allNlPaidQuestion.length === 0) {
            return next(new HttpError('No paid exams found', 500));
        }

        res.json({ paid_exams: allNlPaidQuestion.map(question => question.toObject({ getters: true })) });
    }
    else {
        res.json({ message: 'Invalid or no lang header found' });
    }

};

const addPaidExam = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const {
        name,
        name_ar,
        name_nl,
        description,
        description_ar,
        description_nl } = req.body;

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
    // Part 1
    let existingPaidQuestions;
    try {
        existingPaidQuestions = await PaidExamQuestion.find({ part: 'part 1' });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingPaidQuestions || existingPaidQuestions.length < 26) {
        return next(new HttpError('Not enough part 1 questions in the bank', 422));
    }

    // Part 2

    let existingPaidQuestions2;
    try {
        existingPaidQuestions2 = await PaidExamQuestion.find({ part: 'part 2' });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingPaidQuestions2 || existingPaidQuestions2.length < 13) {
        return next(new HttpError('Not enough part 2 questions in the bank', 422));
    }

    // Part 3
    let existingPaidQuestions3;
    try {
        existingPaidQuestions3 = await PaidExamQuestion.find({ part: 'part 3' });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingPaidQuestions3 || existingPaidQuestions3.length < 29) {
        return next(new HttpError('Not enough part 3 questions in the bank', 422));
    }

    const randPart2 = existingPaidQuestions2.sort(() => Math.random() - Math.random()).slice(0, 24);
    const randPart1 = existingPaidQuestions.sort(() => Math.random() - Math.random()).slice(0, 11);
    const randPart3 = existingPaidQuestions3.sort(() => Math.random() - Math.random()).slice(0, 27);

    let randPart1Ids = [];
    randPart1.forEach(element => {
        randPart1Ids.push(element.id);
    });

    let randPart2Ids = [];
    randPart2.forEach(element => {
        randPart2Ids.push(element.id);
    });

    let randPart3Ids = [];
    randPart3.forEach(element => {
        randPart3Ids.push(element.id);
    });

    // Ar Random part 1
    let existingArQuestions;
    try {
        existingArQuestions = await ArPaidExamQuestion.find({});
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetch ar paid questions', 500));
    };

    if (!existingArQuestions || existingArQuestions.length === 0) {
        return next(new HttpError('No ar paid questions found', 422));
    }

    const arRandPart1 = existingArQuestions.filter(question => {
        return randPart1Ids.find(ide => {
            return question.enId === ide;
        })
    });

    // Ar Random part 2
    const arRandPart2 = existingArQuestions.filter(question => {
        return randPart2Ids.find(ide => {
            return question.enId === ide;
        })
    });

    // Ar Random part 3
    const arRandPart3 = existingArQuestions.filter(question => {
        return randPart3Ids.find(ide => {
            return question.enId === ide;
        })
    });


    // Nl Random part 1
    let existingNlQuestions;
    try {
        existingNlQuestions = await NlPaidExamQuestion.find({});
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetch ar paid questions', 500));
    };

    if (!existingNlQuestions || existingNlQuestions.length === 0) {
        return next(new HttpError('No ar paid questions found', 422));
    }

    const nlRandPart1 = existingNlQuestions.filter(question => {
        return randPart1Ids.find(ide => {
            return question.enId === ide;
        })
    });

    // Nl Random part 2
    const nlRandPart2 = existingNlQuestions.filter(question => {
        return randPart2Ids.find(ide => {
            return question.enId === ide;
        })
    });

    // Nl Random part 3
    const nlRandPart3 = existingNlQuestions.filter(question => {
        return randPart3Ids.find(ide => {
            return question.enId === ide;
        })
    });

    const newPaidExam = new PaidExam({
        name,
        description
    });

    const newArPaidExam = new ArPaidExam({
        enId: newPaidExam.id,
        name: name_ar,
        description: description_ar
    });

    const newNlPaidExam = new NlPaidExam({
        enId: newPaidExam.id,
        name: name_nl,
        description: description_nl
    });

    const newQuestionsAllocation = new QuestionAllocation({
        examId: newPaidExam.id,
        part1: JSON.stringify(randPart1),
        part2: JSON.stringify(randPart2),
        part3: JSON.stringify(randPart3),
    });

    const newArQuestionsAllocation = new ArQuestionAllocation({
        enId: newQuestionsAllocation.id,
        examId: newArPaidExam.id,
        part1: JSON.stringify(arRandPart1),
        part2: JSON.stringify(arRandPart2),
        part3: JSON.stringify(arRandPart3),
    });

    const newNlQuestionsAllocation = new NlQuestionAllocation({
        enId: newQuestionsAllocation.id,
        examId: newNlPaidExam.id,
        part1: JSON.stringify(nlRandPart1),
        part2: JSON.stringify(nlRandPart2),
        part3: JSON.stringify(nlRandPart3),
    });

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await newPaidExam.save({ session: session });
        await newArPaidExam.save({ session: session });
        await newNlPaidExam.save({ session: session });
        await newQuestionsAllocation.save({ session: session });
        await newArQuestionsAllocation.save({ session: session });
        await newNlQuestionsAllocation.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        return next(new HttpError('Error saving paid exam to database', 500));
    };

    res.status(201).json({ message: 'Exam created successfully' });
};

const editPaidExam = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received from frontend', 422));
    }

    const examId = req.params.examId;
    const {
        name,
        name_ar,
        name_nl,
        description,
        description_ar,
        description_nl } = req.body;


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

    // Ar
    let existingArPaidExam;
    try {
        existingArPaidExam = await ArPaidExam.findOne({ enId: examId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    }

    if (!existingArPaidExam) {
        return next(new HttpError('Ar exam not found', 422));
    }

    // Nl
    let existingNlPaidExam;
    try {
        existingNlPaidExam = await NlPaidExam.findOne({ enId: examId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching data from database', 500));
    }

    if (!existingNlPaidExam) {
        return next(new HttpError('Nl exam not found', 422));
    }

    existingPaidExam.name = name;
    existingPaidExam.description = description;

    existingArPaidExam.name = name_ar;
    existingArPaidExam.description = description_ar;

    existingNlPaidExam.name = name_nl;
    existingNlPaidExam.description = description_nl;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingPaidExam.save({ session: session });
        await existingArPaidExam.save({ session: session });
        await existingNlPaidExam.save({ session: session });
        await session.commitTransaction();
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

    const {
        question,
        question_ar,
        question_nl,
        answer,
        draggable,
        answer_ar,
        answer_nl,
        options,
        options_ar,
        options_nl,
        part,
        part_ar,
        part_nl, } = req.body;


    const paidQuestion = new PaidExamQuestion({
        question,
        questionImage: req.file.path,
        draggable,
        answer,
        options,
        part
    });

    const arPaidQuestion = new ArPaidExamQuestion({
        enId: paidQuestion.id,
        question: question_ar,
        draggable,
        questionImage: req.file.path,
        answer: answer_ar,
        options: options_ar,
        part: part_ar
    });

    const nlPaidQuestion = new NlPaidExamQuestion({
        enId: paidQuestion.id,
        question: question_nl,
        questionImage: req.file.path,
        draggable,
        answer: answer_nl,
        options: options_nl,
        part: part_nl
    });

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await paidQuestion.save({ session: session });
        await arPaidQuestion.save({ session: session });
        await nlPaidQuestion.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        return next(new HttpError('Error saving paid question', 422));
    }

    res.status(201).json({ message: 'Question added successfully' });
};

const deletePaidExam = async (req, res, next) => {
    const examId = req.params.examId;

    let existingPaidExam;
    try {
        existingPaidExam = await PaidExam.findById(examId);
    } catch (error) {
        return next(new HttpError('Error fetching paid exam from database', 500));
    };

    if (!existingPaidExam) {
        return next(new HttpError('No exam id found', 422));
    }

    // Ar paid exam
    let existingArPaidExam;
    try {
        existingArPaidExam = await ArPaidExam.findOne({ enId: examId });
    } catch (error) {
        return next(new HttpError('Error fetching paid exam from database', 500));
    };

    if (!existingArPaidExam) {
        return next(new HttpError('No exam id found', 422));
    }

    // Nl paid exam
    let existingNlPaidExam;
    try {
        existingNlPaidExam = await NlPaidExam.findOne({ enId: examId });
    } catch (error) {
        return next(new HttpError('Error fetching paid exam from database', 500));
    };

    if (!existingNlPaidExam) {
        return next(new HttpError('No exam id found', 422));
    }

    // En exam allocation
    let existingQuestionsAllocation;
    try {
        existingQuestionsAllocation = await QuestionAllocation.findOne({ examId: existingPaidExam.id });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching en question allocation', 500));
    };

    if (!existingQuestionsAllocation) {
        return next(new HttpError('No en question allocation found', 422));

    }

    // Ar exam allocation
    let existingArQuestionsAllocation;
    try {
        existingArQuestionsAllocation = await ArQuestionAllocation.findOne({ examId: existingArPaidExam.id });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching ar question allocation', 500));
    };

    if (!existingArQuestionsAllocation) {
        return next(new HttpError('No ar question allocation found', 422));

    }

    // Nl exam allocation
    let existingNlQuestionsAllocation;
    try {
        existingNlQuestionsAllocation = await NlQuestionAllocation.findOne({ examId: existingNlPaidExam.id });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching ar question allocation', 500));
    };

    if (!existingNlQuestionsAllocation) {
        return next(new HttpError('No ar question aArQuestionAllocationllocation found', 422));

    }

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingPaidExam.remove();
        await existingArPaidExam.remove();
        await existingNlPaidExam.remove();
        await existingQuestionsAllocation.remove();
        await existingArQuestionsAllocation.remove();
        await existingNlQuestionsAllocation.remove();
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
        existingQuestion = await PaidExamQuestion.findById(quesId);
    } catch (error) {
        return next(new HttpError('Error fetching paid question from database', 500));
    };

    if (!existingQuestion) {
        return next(new HttpError('No paid question found against id', 422));
    }

    // Ar
    let existingArQuestion;
    try {
        existingArQuestion = await ArPaidExamQuestion.findOne({ enId: quesId });
    } catch (error) {
        return next(new HttpError('Error fetching paid question from database', 500));
    };

    if (!existingArQuestion) {
        return next(new HttpError('No paid question found against id', 422));
    }

    // Nl
    let existingNlQuestion;
    try {
        existingNlQuestion = await NlPaidExamQuestion.findOne({ enId: quesId });
    } catch (error) {
        return next(new HttpError('Error fetching paid question from database', 500));
    };

    if (!existingNlQuestion) {
        return next(new HttpError('No paid question found against id', 422));
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

    // Ar
    let existingArQuestion;
    try {
        existingArQuestion = await ArPaidExamQuestion.findOne({ enId: quesId });
    } catch (error) {
        return next(new HttpError('Error fetching paid question from database', 500));
    };

    if (!existingArQuestion) {
        return next(new HttpError('No ar paid question found against id', 422));
    }

    // Nl
    let existingNlQuestion;
    try {
        existingNlQuestion = await NlPaidExamQuestion.findOne({ enId: quesId });
    } catch (error) {
        return next(new HttpError('Error fetching paid question from database', 500));
    };

    if (!existingNlQuestion) {
        return next(new HttpError('No nl paid question found against id', 422));
    }

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingQuestion.remove({ session: session });
        await existingArQuestion.remove({ session: session });
        await existingNlQuestion.remove({ session: session });
        await session.commitTransaction();
    } catch (error) {
        return next(new HttpError('Error updating question', 500));
    };

    res.json({ message: 'Question deleted successfully' });

};

const allPaidQuestions = async (req, res, next) => {

    if (req.headers.lang === 'en') {
        let existingPaidQuestions;
        try {
            existingPaidQuestions = await PaidExamQuestion.find({});
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting data from database', 500));
        };

        if (!existingPaidQuestions || existingPaidQuestions.length === 0) {
            return next(new HttpError('No paid questions found', 422));
        }

        res.json({ paid_questions: existingPaidQuestions.map(ques => ques.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'ar') {
        let existingArPaidQuestions;
        try {
            existingArPaidQuestions = await ArPaidExamQuestion.find({});
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting data from database', 500));
        };

        if (!existingArPaidQuestions || existingArPaidQuestions.length === 0) {
            return next(new HttpError('No paid questions found', 422));
        }

        res.json({ paid_questions: existingArPaidQuestions.map(ques => ques.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'nl') {
        let existingNlPaidQuestions;
        try {
            existingNlPaidQuestions = await NlPaidExamQuestion.find({});
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting data from database', 500));
        };

        if (!existingNlPaidQuestions || existingNlPaidQuestions.length === 0) {
            return next(new HttpError('No paid questions found', 422));
        }

        res.json({ paid_questions: existingNlPaidQuestions.map(ques => ques.toObject({ getters: true })) });
    }
    else {
        res.json({ message: 'Invalid or no lang header found' });
    }

};

const paidExamResult = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    const userId = req.params.userId;
    const { examId, answers } = req.body;

    let existingUser;
    try {
        existingUser = await User.findById(userId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting user from database', 500));
    };

    if (!existingUser) {
        return next(new HttpError('No user found against id', 422));
    }

    if (req.headers.lang === 'en') {
        let existingPaidExam;
        try {
            existingPaidExam = await PaidExam.findById(examId);
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        };

        if (!existingPaidExam) {
            return next(new HttpError('No paid exam found against id', 422));
        }

        let existingQuestionsAllocation;
        try {
            existingQuestionsAllocation = await QuestionAllocation.findOne({ examId: examId });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching en questions allocation from database', 500));
        };

        if (!existingQuestionsAllocation) {
            return next(new HttpError('No en question allocations found against examId', 422));
        }

        const partOneQuestions = JSON.parse(existingQuestionsAllocation.part1);
        const partTwoQuestions = JSON.parse(existingQuestionsAllocation.part2);
        const partThreeQuestions = JSON.parse(existingQuestionsAllocation.part3);

        const partOneAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = partOneQuestions.find(question => question._id === answer.id);
            if (finalAnswers !== undefined) {
                if (!finalAnswers.draggable) {
                    if (answer.answer === finalAnswers.answer) {
                        return {
                            id: answer.id,
                            status: true,
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
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
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
                        };
                    }
                }
            }
        });

        const partTwoAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = partTwoQuestions.find(question => question._id === answer.id);
            if (finalAnswers !== undefined) {
                if (!finalAnswers.draggable) {
                    if (answer.answer === finalAnswers.answer) {
                        return {
                            id: answer.id,
                            status: true,
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
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
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
                        };
                    }
                }
            }
        });

        const partThreeAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = partThreeQuestions.find(question => question._id === answer.id);
            if (finalAnswers !== undefined) {
                if (!finalAnswers.draggable) {
                    if (answer.answer === finalAnswers.answer) {
                        return {
                            id: answer.id,
                            status: true,
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
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
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
                        };
                    }
                }
            }
        });

        const partOneResults = await Promise.all(partOneAnswers);
        const partTwoResults = await Promise.all(partTwoAnswers);
        const partThreeResults = await Promise.all(partThreeAnswers);

        const finalPartOne = partOneResults.filter(result => result);
        const finalPartTwo = partTwoResults.filter(result => result);
        const finalPartThree = partThreeResults.filter(result => result);

        const partOneCorrect = finalPartOne.filter(result => result.status).length;
        const partTwoCorrect = finalPartTwo.filter(result => result.status).length;
        const partThreeCorrect = finalPartThree.filter(result => result.status).length;


        const partOnePass = partOneCorrect > 0 ? true : false;
        const partTwoPass = partTwoCorrect > 0 ? true : false;
        const partThreePass = partThreeCorrect > 0 ? true : false;


        const result = {
            examId,
            result: {
                part_one: {
                    final_result: finalPartOne,
                    correct: partOneCorrect,
                    pass: partOnePass
                },
                part_two: {
                    final_result: finalPartTwo,
                    correct: partTwoCorrect,
                    pass: partTwoPass
                },
                part_three: {
                    final_result: finalPartThree,
                    correct: partThreeCorrect,
                    pass: partThreePass
                }
            }
        }

        const newResult = new Result({
            userId,
            results: result,
            lang: 'en'
        });

        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await newResult.save({ session });
            existingUser.enrolled.pull({ examId: existingPaidExam.id, lang: 'en' });
            existingUser.completed.push({ examId: existingPaidExam.id, lang: 'en' });
            await existingUser.save({ session });
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error saving data to database', 500));
        };

        res.json({ exam_result: result, userId: existingUser.id, email: existingUser.email, username: existingUser.username, freeAccess: existingUser.freeAccess, subscriptionid: existingUser.subscriptionid, enrolled: existingUser.enrolled, completed: existingUser.completed });
    }
    else if (req.headers.lang === 'ar') {
        let existingArPaidExam;
        try {
            existingArPaidExam = await ArPaidExam.findById(examId);
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        };

        if (!existingArPaidExam) {
            return next(new HttpError('No paid exam found against id', 422));
        }

        let existingArQuestionsAllocation;
        try {
            existingArQuestionsAllocation = await ArQuestionAllocation.findOne({ examId: examId });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching en questions allocation from database', 500));
        };

        if (!existingArQuestionsAllocation) {
            return next(new HttpError('No en question allocations found against examId', 422));
        }

        const partOneQuestions = JSON.parse(existingArQuestionsAllocation.part1);
        const partTwoQuestions = JSON.parse(existingArQuestionsAllocation.part2);
        const partThreeQuestions = JSON.parse(existingArQuestionsAllocation.part3);

        const partOneAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = partOneQuestions.find(question => question._id === answer.id);
            if (finalAnswers !== undefined) {
                if (!finalAnswers.draggable) {
                    if (answer.answer === finalAnswers.answer) {
                        return {
                            id: answer.id,
                            status: true,
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
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
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
                        };
                    }
                }
            }
        });

        const partTwoAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = partTwoQuestions.find(question => question._id === answer.id);
            if (finalAnswers !== undefined) {
                if (!finalAnswers.draggable) {
                    if (answer.answer === finalAnswers.answer) {
                        return {
                            id: answer.id,
                            status: true,
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
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
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
                        };
                    }
                }
            }
        });

        const partThreeAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = partThreeQuestions.find(question => question._id === answer.id);
            if (finalAnswers !== undefined) {
                if (!finalAnswers.draggable) {
                    if (answer.answer === finalAnswers.answer) {
                        return {
                            id: answer.id,
                            status: true,
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
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
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
                        };
                    }
                }
            }
        });

        const partOneResults = await Promise.all(partOneAnswers);
        const partTwoResults = await Promise.all(partTwoAnswers);
        const partThreeResults = await Promise.all(partThreeAnswers);

        const finalPartOne = partOneResults.filter(result => result);
        const finalPartTwo = partTwoResults.filter(result => result);
        const finalPartThree = partThreeResults.filter(result => result);

        const partOneCorrect = finalPartOne.filter(result => result.status).length;
        const partTwoCorrect = finalPartTwo.filter(result => result.status).length;
        const partThreeCorrect = finalPartThree.filter(result => result.status).length;


        const partOnePass = partOneCorrect >= 13 ? true : false;
        const partTwoPass = partTwoCorrect >= 10 ? true : false;
        const partThreePass = partThreeCorrect >= 25 ? true : false;


        const result = {
            examId,
            result: {
                part_one: {
                    final_result: finalPartOne,
                    correct: partOneCorrect,
                    pass: partOnePass
                },
                part_two: {
                    final_result: finalPartTwo,
                    correct: partTwoCorrect,
                    pass: partTwoPass
                },
                part_three: {
                    final_result: finalPartThree,
                    correct: partThreeCorrect,
                    pass: partThreePass
                }
            }
        }

        const newResult = new Result({
            userId,
            results: result,
            lang: 'ar'
        });

        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await newResult.save({ session });
            existingUser.enrolled.pull({ examId: existingArPaidExam.id, lang: 'ar' });
            existingUser.completed.push({ examId: existingArPaidExam.id, lang: 'ar' });
            await existingUser.save({ session });
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error saving data to database', 500));
        };

        res.json({ exam_result: result, userId: existingUser.id, email: existingUser.email, username: existingUser.username, freeAccess: existingUser.freeAccess, subscriptionid: existingUser.subscriptionid, enrolled: existingUser.enrolled, completed: existingUser.completed });
    }
    else if (req.headers.lang === 'nl') {
        let existingNlPaidExam;
        try {
            existingNlPaidExam = await NlPaidExam.findById(examId);
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        };

        if (!existingNlPaidExam) {
            return next(new HttpError('No paid exam found against id', 422));
        }

        let existingNlQuestionsAllocation;
        try {
            existingNlQuestionsAllocation = await NlQuestionAllocation.findOne({ examId: examId });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching en questions allocation from database', 500));
        };

        if (!existingNlQuestionsAllocation) {
            return next(new HttpError('No en question allocations found against examId', 422));
        }

        const partOneQuestions = JSON.parse(existingNlQuestionsAllocation.part1);
        const partTwoQuestions = JSON.parse(existingNlQuestionsAllocation.part2);
        const partThreeQuestions = JSON.parse(existingNlQuestionsAllocation.part3);

        const partOneAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = partOneQuestions.find(question => question._id === answer.id);
            if (finalAnswers !== undefined) {
                if (!finalAnswers.draggable) {
                    if (answer.answer === finalAnswers.answer) {
                        return {
                            id: answer.id,
                            status: true,
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
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
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
                        };
                    }
                }
            }
        });

        const partTwoAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = partTwoQuestions.find(question => question._id === answer.id);
            if (finalAnswers !== undefined) {
                if (!finalAnswers.draggable) {
                    if (answer.answer === finalAnswers.answer) {
                        return {
                            id: answer.id,
                            status: true,
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
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
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
                        };
                    }
                }
            }
        });

        const partThreeAnswers = answers.map(async answer => {
            if (!answer.id) {
                return next(new HttpError('Question id is required', 422));
            }
            const finalAnswers = partThreeQuestions.find(question => question._id === answer.id);
            if (finalAnswers !== undefined) {
                if (!finalAnswers.draggable) {
                    if (answer.answer === finalAnswers.answer) {
                        return {
                            id: answer.id,
                            status: true,
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
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
                            correct_answer: answer.answer
                        };
                    }
                    else {
                        return {
                            id: answer.id,
                            status: false,
                            correct_answer: answer.answer
                        };
                    }
                }
            }
        });

        const partOneResults = await Promise.all(partOneAnswers);
        const partTwoResults = await Promise.all(partTwoAnswers);
        const partThreeResults = await Promise.all(partThreeAnswers);

        const finalPartOne = partOneResults.filter(result => result);
        const finalPartTwo = partTwoResults.filter(result => result);
        const finalPartThree = partThreeResults.filter(result => result);

        const partOneCorrect = finalPartOne.filter(result => result.status).length;
        const partTwoCorrect = finalPartTwo.filter(result => result.status).length;
        const partThreeCorrect = finalPartThree.filter(result => result.status).length;


        const partOnePass = partOneCorrect > 0 ? true : false;
        const partTwoPass = partTwoCorrect > 0 ? true : false;
        const partThreePass = partThreeCorrect > 0 ? true : false;


        const result = {
            examId,
            result: {
                part_one: {
                    final_result: finalPartOne,
                    correct: partOneCorrect,
                    pass: partOnePass
                },
                part_two: {
                    final_result: finalPartTwo,
                    correct: partTwoCorrect,
                    pass: partTwoPass
                },
                part_three: {
                    final_result: finalPartThree,
                    correct: partThreeCorrect,
                    pass: partThreePass
                }
            }
        }

        const newResult = new Result({
            userId,
            results: result,
            lang: 'nl'
        });

        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await newResult.save({ session });
            existingUser.enrolled.pull({ examId: existingNlPaidExam.id, lang: 'nl' });
            existingUser.completed.push({ examId: existingNlPaidExam.id, lang: 'nl' });
            await existingUser.save({ session });
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error saving data to database', 500));
        };

        res.json({ exam_result: result, userId: existingUser.id, email: existingUser.email, username: existingUser.username, freeAccess: existingUser.freeAccess, subscriptionid: existingUser.subscriptionid, enrolled: existingUser.enrolled, completed: existingUser.completed });
    }

};

const allExamResults = async (req, res, next) => {

    if (req.headers.lang === 'en') {
        let existingResults;
        try {
            existingResults = await Result.find({ lang: 'en' });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting results from the database', 500));
        };

        if (!existingResults) {
            return next(new HttpError('No results found', 422));
        }

        res.json({ results: existingResults.map(result => result.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'ar') {
        let existingArResults;
        try {
            existingArResults = await Result.find({ lang: 'ar' });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting results from the database', 500));
        };

        if (!existingArResults) {
            return next(new HttpError('No results found', 422));
        }

        res.json({ results: existingArResults.map(result => result.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'nl') {
        let existingNlResults;
        try {
            existingNlResults = await Result.find({ lang: 'nl' });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting results from the database', 500));
        };

        if (!existingNlResults) {
            return next(new HttpError('No results found', 422));
        }

        res.json({ results: existingNlResults.map(result => result.toObject({ getters: true })) });
    }

};

const paidExamDetails = async (req, res, next) => {
    const examId = req.params.examId;

    if (req.headers.lang === 'en') {
        let existingQuestionsAllocation;
        try {
            existingQuestionsAllocation = await QuestionAllocation.findOne({ examId: examId });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting en questions allocation from database', 500));
        };

        if (!existingQuestionsAllocation || existingQuestionsAllocation.length === 0) {
            return next(new HttpError('No en questions found', 422));
        }

        res.json({ exam_details: existingQuestionsAllocation });

    }
    else if (req.headers.lang === 'ar') {
        let existingArQuestionsAllocation;
        try {
            existingArQuestionsAllocation = await ArQuestionAllocation.findOne({ examId: examId });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting en questions allocation from database', 500));
        };

        if (!existingArQuestionsAllocation || existingArQuestionsAllocation.length === 0) {
            return next(new HttpError('No en questions found', 422));
        }

        res.json({ exam_details: existingArQuestionsAllocation });

    }
    else if (req.headers.lang === 'nl') {
        let existingNlQuestionsAllocation;
        try {
            existingNlQuestionsAllocation = await NlQuestionAllocation.findOne({ examId: examId });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error getting en questions allocation from database', 500));
        };

        if (!existingNlQuestionsAllocation || existingNlQuestionsAllocation.length === 0) {
            return next(new HttpError('No en questions found', 422));
        }
        res.json({ exam_details: existingNlQuestionsAllocation });
    }
    else {
        res.json({ message: 'No or invalid lang header' });
    }
};

const userResults = async (req, res, next) => {
    const userId = req.params.userId;

    if (req.headers.lang === 'en') {
        let userExistingResults;
        try {
            userExistingResults = await Result.find({ userId: userId, lang: 'en' });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        };

        if (!userExistingResults || userExistingResults.length === 0) {
            return next(new HttpError('No results found against user id', 422));
        }

        res.json({ user_results: userExistingResults.map(result => result.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'ar') {
        let userArExistingResults;
        try {
            userArExistingResults = await Result.find({ userId: userId, lang: 'ar' });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        };

        if (!userArExistingResults || userArExistingResults.length === 0) {
            return next(new HttpError('No results found against user id', 422));
        }

        res.json({ user_results: userArExistingResults.map(result => result.toObject({ getters: true })) });
    }
    else if (req.headers.lang === 'nl') {
        let userNlExistingResults;
        try {
            userNlExistingResults = await Result.find({ userId: userId, lang: 'nl' });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error fetching data from database', 500));
        };

        if (!userNlExistingResults || userNlExistingResults.length === 0) {
            return next(new HttpError('No results found against user id', 422));
        }

        res.json({ user_results: userNlExistingResults.map(result => result.toObject({ getters: true })) });
    }
    else {
        return next(new HttpError('Invalid or no lang header found', 422));
    }
};

exports.getPaidExam = getPaidExam;
exports.addPaidExam = addPaidExam;
exports.editPaidExam = editPaidExam;
exports.addPaidExamQuestion = addPaidExamQuestion;
exports.deletePaidExam = deletePaidExam;
exports.editPaidExamQuestion = editPaidExamQuestion;
exports.deletePaidExamQuestion = deletePaidExamQuestion;
exports.allPaidQuestions = allPaidQuestions;
exports.paidExamResult = paidExamResult;
exports.allExamResults = allExamResults;
exports.paidExamDetails = paidExamDetails;
exports.userResults = userResults;