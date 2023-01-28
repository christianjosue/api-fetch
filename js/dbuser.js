const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    email: {
        type: String,
        require: true,
        min: 6,
        max: 255
    }, 
    password: {
        type: String, 
        require: true,
        minlength: 6
    }
});

module.exports = mongoose.model('User', userSchema);