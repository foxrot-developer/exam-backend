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

    if (!existingPaidQuestions || existingPaidQuestions.length < 5) {
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

    if (!existingPaidQuestions2 || existingPaidQuestions2.length < 5) {
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

    if (!existingPaidQuestions3 || existingPaidQuestions3.length < 5) {
        return next(new HttpError('Not enough part 3 questions in the bank', 422));
    }

    const randPart2 = existingPaidQuestions2.sort(() => Math.random() - Math.random()).slice(0, 3);
    const randPart1 = existingPaidQuestions.sort(() => Math.random() - Math.random()).slice(0, 3);
    const randPart3 = existingPaidQuestions3.sort(() => Math.random() - Math.random()).slice(0, 3);

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
        answer,
        options,
        part
    });

    const arPaidQuestion = new ArPaidExamQuestion({
        enId: paidQuestion.id,
        question: question_ar,
        questionImage: req.file.path,
        answer: answer_ar,
        options: options_ar,
        part: part_ar
    });

    const nlPaidQuestion = new NlPaidExamQuestion({
        enId: paidQuestion.id,
        question: question_nl,
        questionImage: req.file.path,
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

    let existingPaidQuestions;
    try {
        existingPaidQuestions = await PaidExamQuestion.find({ examId: examId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingPaidQuestions) {
        return next(new HttpError('No paid questions found', 422));
    }

    const partOneQuestions = existingPaidQuestions.filter(question => question.part === 'part 1');
    const partTwoQuestions = existingPaidQuestions.filter(question => question.part === 'part 2');
    const partThreeQuestions = existingPaidQuestions.filter(question => question.part === 'part 3');

    const partOneAnswers = answers.map(async answer => {
        if (!answer.id) {
            return next(new HttpError('Question id is required', 422));
        }
        const finalAnswers = partOneQuestions.find(question => question.id === answer.id);
        if (finalAnswers !== undefined) {
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
        }
    });

    const partTwoAnswers = answers.map(async answer => {
        if (!answer.id) {
            return next(new HttpError('Question id is required', 422));
        }
        const finalAnswers = partTwoQuestions.find(question => question.id === answer.id);
        if (finalAnswers !== undefined) {
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
        }
    });

    const partThreeAnswers = answers.map(async answer => {
        if (!answer.id) {
            return next(new HttpError('Question id is required', 422));
        }
        const finalAnswers = partThreeQuestions.find(question => question.id === answer.id);
        if (finalAnswers !== undefined) {
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
        results: result
    });

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await newResult.save({ session });
        existingUser.enrolled.pull(existingPaidExam);
        existingUser.completed.push(existingPaidExam);
        await existingUser.save({ session });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error saving data to database', 500));
    };

    res.json({ exam_result: result });
};

const allExamResults = async (req, res, next) => {
    let existingResults;
    try {
        existingResults = await Result.find({});
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting results from the database', 500));
    };

    if (!existingResults) {
        return next(new HttpError('No results found', 422));
    }

    res.json({ results: existingResults.map(result => result.toObject({ getters: true })) });
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