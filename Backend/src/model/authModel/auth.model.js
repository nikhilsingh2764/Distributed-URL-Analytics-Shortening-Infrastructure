import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, minlength: 3, maxlength: 30, trim: true, unique: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true, select: false },
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },
        lastLoginAt: { type: Date },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    }
);

const User = mongoose.model("User", userSchema);

export default User;
