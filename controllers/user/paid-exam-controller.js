const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../../helpers/http-error');
const PaidExam = require('../../models/paid-exam');
const PaidExamQuestion = require('../../models/paid-exam-question');
const Result = require('../../models/result');
const User = require('../../models/user');
const QuestionAllocation = require('../../models/question-allocation');

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

    res.json({ paid_exams: allPaidQuestion.map(question => question.toObject({ getters: true })) });
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
    // Part 1
    let existingPaidQuestions;
    try {
        existingPaidQuestions = await PaidExamQuestion.find({ part: 'part 1' });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingPaidQuestions || existingPaidQuestions.length < 1) {
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

    if (!existingPaidQuestions2 || existingPaidQuestions2.length < 1) {
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

    if (!existingPaidQuestions3 || existingPaidQuestions3.length < 1) {
        return next(new HttpError('Not enough part 3 questions in the bank', 422));
    }

    const randPart2 = existingPaidQuestions2.sort(() => Math.random() - Math.random()).slice(0, 3);
    const randPart1 = existingPaidQuestions.sort(() => Math.random() - Math.random()).slice(0, 3);
    const randPart3 = existingPaidQuestions3.sort(() => Math.random() - Math.random()).slice(0, 3);



    const newPaidExam = new PaidExam({
        name,
        description
    });

    const newQuestionsAllocation = new QuestionAllocation({
        examId: newPaidExam.id,
        part1: JSON.stringify(randPart1),
        part2: JSON.stringify(randPart2),
        part3: JSON.stringify(randPart3),
    });

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await newPaidExam.save();
        await newQuestionsAllocation.save();
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

    const { question, answer, options, part } = req.body;

    console.log(req.file);

    const paidQuestion = new PaidExamQuestion({
        question,
        questionImage: req.file.path,
        answer,
        options,
        part
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

    try {
        await existingQuestion.remove();
    } catch (error) {
        return next(new HttpError('Error updating question', 500));
    };

    res.json({ message: 'Question deleted successfully' });

};

const allPaidQuestions = async (req, res, next) => {
    let existingPaidQuestions;
    try {
        existingPaidQuestions = await PaidExamQuestion.find({});
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error getting data from database', 500));
    };

    if (!existingPaidQuestions) {
        return next(new HttpError('No paid questions found', 422));
    }

    res.json({ paid_questions: existingPaidQuestions.map(ques => ques.toObject({ getters: true })) });
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