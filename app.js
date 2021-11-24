const express = require('express');
const mongoose = require('mongoose');

const HttpError = require('./helpers/http-error');
const userRoutes = require('./routes/user/user-routes');
const freeExamRoutes = require('./routes/user/free-exam-routes');
const userSubscriptionRoutes = require('./routes/user/user-subscription-routes');
const adminRoutes = require('./routes/admin/admin-routes');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    next();
});

app.use('/api/users', userRoutes);
app.use('/api/free-exam', freeExamRoutes);
app.use('/api/user-subscriptions', userSubscriptionRoutes);

app.use('/api/admin', adminRoutes);

app.use((req, res, next) => {
    throw new HttpError('Could not find the route', 404);
})

app.use((error, req, res, next) => {
    if (res.headerSent) {
        return next(error)
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occured' });
});

mongoose.connect(`mongodb+srv://usama:usama@cluster0.r4fkm.mongodb.net/exam?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Connected');
    app.listen(process.env.PORT || 5000);
}).catch(err => {
    console.log(err);
});