import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    portfolioOwnerName: {
        type: String,
        required: function (this: any) {
            return this.role === 'user'; // Only required for standard users
        },
        trim: true
    }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
