import { body } from "express-validator";

const email = (field = "email") =>
    body(field)
        .trim()
        .notEmpty().withMessage("Email is required").bail()
        .isEmail().withMessage("Invalid email address").bail()
        .isLength({ max: 254 }).withMessage("Email is too long")
        .customSanitizer((v) => v.toLowerCase());

const username = (field = "username") =>
    body(field)
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage("Username must be between 3 and 30 characters")
        .matches(/^[A-Za-z0-9_]+$/).withMessage("Username can only contain letters, numbers and underscores");

/** 8–72 chars (bcrypt ignores everything past 72 bytes), upper, lower, digit and one symbol. */
const strongPassword = (field) =>
    body(field)
        .isString().withMessage("Password is required").bail()
        .isLength({ min: 8, max: 72 }).withMessage("Password must be 8–72 characters")
        .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain a lowercase letter")
        .matches(/[0-9]/).withMessage("Password must contain a number")
        .matches(/[^A-Za-z0-9]/).withMessage("Password must contain a special character");

const otp = () =>
    body("otp")
        .trim()
        .matches(/^\d{6}$/).withMessage("OTP must be 6 digits");

export const signupValidator = [username(), email(), strongPassword("password")];
export const verifyOtpValidator = [email(), otp()];
export const resendOtpValidator = [email()];
export const loginValidator = [email(), body("password").isString().notEmpty().withMessage("Password is required")];
export const forgotPasswordValidator = [email()];
export const resetPasswordValidator = [email(), otp(), strongPassword("newPassword")];
export const changePasswordValidator = [
    body("currentPassword").isString().notEmpty().withMessage("Current password is required"),
    strongPassword("newPassword"),
];
export const updateProfileValidator = [username()];
export const deleteAccountValidator = [body("password").isString().notEmpty().withMessage("Password is required")];
