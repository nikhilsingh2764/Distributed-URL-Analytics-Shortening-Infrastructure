import mongoose from "mongoose";
import Url from "../../model/urlModel/url.model.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

class UrlRepository {
    create(data) {
        return Url.create(data);
    }

    findByShortCode(shortCode) {
        return Url.findOne({ shortCode });
    }

    findByIdAndUserId(id, userId) {
        return Url.findOne({ _id: id, userId });
    }

    findAllByUserId(filter, { skip = 0, limit = 10, sort = { createdAt: -1 } } = {}) {
        return Url.find(filter).sort(sort).skip(skip).limit(limit);
    }

    count(filter) {
        return Url.countDocuments(filter);
    }

    updateByIdAndUserId(id, userId, update) {
        return Url.findOneAndUpdate({ _id: id, userId }, update, {
            returnDocument: "after",
            runValidators: true,
        });
    }

    deleteByIdAndUserId(id, userId) {
        return Url.findOneAndDelete({ _id: id, userId });
    }

    findIdsAndCodesByUserId(userId) {
        return Url.find({ userId }).select("_id shortCode").lean();
    }

    deleteAllByUserId(userId) {
        return Url.deleteMany({ userId });
    }

    findTopByUserId(userId, limit = 5) {
        return Url.find({ userId }).sort({ clicks: -1, createdAt: -1 }).limit(limit);
    }

    async totalsByUserId(userId, now = new Date()) {
        const never = new Date("9999-12-31T00:00:00Z");
        const [row] = await Url.aggregate([
            { $match: { userId: toObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalLinks: { $sum: 1 },
                    totalClicks: { $sum: "$clicks" },
                    expiredLinks: {
                        $sum: { $cond: [{ $lte: [{ $ifNull: ["$expiresAt", never] }, now] }, 1, 0] },
                    },
                },
            },
        ]);
        return row || { totalLinks: 0, totalClicks: 0, expiredLinks: 0 };
    }

    recordClick(id, at) {
        return Url.updateOne({ _id: id }, { $inc: { clicks: 1 }, $set: { lastClickedAt: at } });
    }
}

export default new UrlRepository();
