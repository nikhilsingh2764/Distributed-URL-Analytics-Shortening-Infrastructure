import mongoose from "mongoose";
import Click from "../../model/analyticsModel/click.model.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));
const dayFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } };

const topN = (field) => [
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 10 },
];

class ClickRepository {
    create(data) {
        return Click.create(data);
    }

    countSince(urlId, since) {
        return Click.countDocuments({ urlId, createdAt: { $gte: since } });
    }

    findRecent(urlId, limit = 10) {
        return Click.find({ urlId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select("browser os device country referrer createdAt")
            .lean();
    }

    deleteByUrlIds(urlIds) {
        return Click.deleteMany({ urlId: { $in: urlIds } });
    }

    /** One round trip for every breakdown the analytics page needs. */
    async analyticsForUrl(urlId, start, end) {
        const [result] = await Click.aggregate([
            { $match: { urlId: toObjectId(urlId), createdAt: { $gte: start, $lte: end } } },
            {
                $facet: {
                    total: [{ $count: "n" }],
                    unique: [{ $group: { _id: "$visitorId" } }, { $count: "n" }],
                    daily: [{ $group: { _id: dayFormat, count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
                    browsers: topN("browser"),
                    os: topN("os"),
                    devices: topN("device"),
                    countries: topN("country"),
                    referrers: topN("referrer"),
                },
            },
        ]);
        return result;
    }

    dailyForUrls(urlIds, start, end) {
        return Click.aggregate([
            { $match: { urlId: { $in: urlIds.map(toObjectId) }, createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: dayFormat, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);
    }
}

export default new ClickRepository();
