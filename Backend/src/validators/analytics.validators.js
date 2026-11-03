import { param, query } from "express-validator";

export const analyticsValidator = [
    param("id").isMongoId().withMessage("Invalid URL ID"),
    query("startDate").optional().isISO8601().withMessage("Invalid start date"),
    query("endDate").optional().isISO8601().withMessage("Invalid end date"),
];
