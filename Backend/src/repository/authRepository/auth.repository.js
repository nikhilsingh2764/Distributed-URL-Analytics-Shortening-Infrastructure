import User from "../../model/authModel/auth.model.js";

class UserRepository {
    create(data) {
        return User.create(data);
    }

    findById(id) {
        return User.findById(id);
    }

    findByIdWithPassword(id) {
        return User.findById(id).select("+password");
    }

    findByEmail(email) {
        return User.findOne({ email });
    }

    findByEmailWithPassword(email) {
        return User.findOne({ email }).select("+password");
    }

    findByUsernameOrEmail(username, email) {
        return User.findOne({ $or: [{ username }, { email }] });
    }

    usernameExists(username, excludeId) {
        const filter = { username };
        if (excludeId) filter._id = { $ne: excludeId };
        return User.exists(filter);
    }

    updateProfile(id, data) {
        return User.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true });
    }

    setPassword(id, password) {
        return User.findByIdAndUpdate(id, { password }, { returnDocument: "after" });
    }

    setLastLogin(id) {
        return User.updateOne({ _id: id }, { lastLoginAt: new Date() });
    }

    deactivate(id) {
        return User.findByIdAndUpdate(id, { isActive: false }, { returnDocument: "after" });
    }

    deleteById(id) {
        return User.findByIdAndDelete(id);
    }
}

export default new UserRepository();
