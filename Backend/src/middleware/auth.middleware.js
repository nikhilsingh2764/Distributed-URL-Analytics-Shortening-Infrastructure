import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import userRepository from "../repository/authRepository/auth.repository.js";
import { verifyAccessToken } from "../utils/generateToken.js";

const extractToken = (req) => {
    if (req.cookies?.accessToken) return req.cookies.accessToken;
    const header = req.get("authorization");
    if (header?.startsWith("Bearer ")) return header.slice(7);
    return null;
};

const authMiddleware = async (req, _res, next) => {
    try {
        const token = extractToken(req);
        if (!token) throw new ApiError(401, "unauthorized");

        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (error) {
            // The frontend watches for "token_expired" to silently call /auth/refresh-token.
            if (error instanceof jwt.TokenExpiredError) throw new ApiError(401, "token_expired");
            throw new ApiError(401, "invalid_token");
        }

        const user = await userRepository.findById(decoded.sub);
        if (!user) throw new ApiError(401, "unauthorized");
        if (!user.isActive) throw new ApiError(403, "account_is_deactivated");

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

export default authMiddleware;
