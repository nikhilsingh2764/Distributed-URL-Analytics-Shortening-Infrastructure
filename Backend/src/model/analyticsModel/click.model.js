import mongoose from "mongoose";

const clickSchema = new mongoose.Schema(
    {
        urlId: { type: mongoose.Schema.Types.ObjectId, ref: "Url", required: true },
        // Keyed hash of IP + user-agent: lets us count unique visitors without storing raw IP addresses.
        visitorId: { type: String },
        userAgent: { type: String, maxlength: 300 },
        browser: { type: String, default: "Other" },
        os: { type: String, default: "Other" },
        device: { type: String, default: "Desktop" },
        country: { type: String, default: "Unknown" },
        referrer: { type: String, default: "Direct" },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

clickSchema.index({ urlId: 1, createdAt: -1 });

const Click = mongoose.model("Click", clickSchema);

export default Click;
