import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

/** Turns express-validator results into a 400 with a compact `errors` array. */
const validate = (req, _res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    next(new ApiError(400, "validation_failed", errors));
};

export default validate;
