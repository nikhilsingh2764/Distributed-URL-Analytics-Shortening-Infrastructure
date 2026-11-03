import RefreshToken from "../../model/authModel/refreshToken.model.js";

class RefreshTokenRepository {
    create(data) {
        return RefreshToken.create(data);
    }

    /** Atomically find-and-delete, so a refresh token can only be used once (rotation). */
    consumeByHash(tokenHash) {
        return RefreshToken.findOneAndDelete({ tokenHash });
    }

    deleteByHash(tokenHash) {
        return RefreshToken.deleteOne({ tokenHash });
    }

    deleteByUserId(userId) {
        return RefreshToken.deleteMany({ userId });
    }
}

export default new RefreshTokenRepository();
