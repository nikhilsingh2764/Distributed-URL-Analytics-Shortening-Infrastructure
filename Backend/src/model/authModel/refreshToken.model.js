import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        // Only a SHA-256 hash of the token is stored, so a DB leak does not leak usable tokens.
        tokenHash: { type: String, required: true, unique: true },
        userAgent: { type: String },
        // MongoDB deletes the document automatically once this date passes.
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
    },
    { timestamps: true }
);

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
