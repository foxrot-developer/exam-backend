const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const HttpError = require('./helpers/http-error');
const userRoutes = require('./routes/user/user-routes');
const freeExamRoutes = require('./routes/user/free-exam-routes');
const userSubscriptionRoutes = require('./routes/user/user-subscription-routes');
const adminRoutes = require('./routes/admin/admin-routes');
const paidExamRoutes = require('./routes/user/paid-exam-routes');

const app = express();

app.use(express.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, lang');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    next();
});

app.use('/api/users', userRoutes);
app.use('/api/free-exam', freeExamRoutes);
app.use('/api/user-subscriptions', userSubscriptionRoutes);
app.use('/api/paid-exam', paidExamRoutes);

app.use('/api/admin', adminRoutes);

app.use((req, res, next) => {
    throw new HttpError('Could not find the route', 404);
})

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, err => console.log(err));
    }
    if (res.headerSent) {
        return next(error)
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occured' });
});

mongoose.connect(`mongodb+srv://oday:D3velop1nJDE@exam.zj7fc.mongodb.net/alshahba?authSource=admin&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Connected');
    app.listen(process.env.PORT || 5001);
}).catch(err => {
    console.log(err);
});