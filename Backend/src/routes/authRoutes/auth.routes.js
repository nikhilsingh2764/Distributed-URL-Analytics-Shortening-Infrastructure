import express from "express";

import authMiddleware from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validator.js";
import {
    signupLimiter,
    loginLimiter,
    verifyOtpLimiter,
    resendOtpLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter,
    refreshTokenLimiter,
    logoutLimiter,
    changePasswordLimiter,
    sensitiveActionLimiter,
} from "../../middleware/rateLimiter.middleware.js";
import {
    signupValidator,
    verifyOtpValidator,
    resendOtpValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changePasswordValidator,
    updateProfileValidator,
    deleteAccountValidator,
} from "../../validators/auth.validators.js";
import {
    Signup,
    VerifyOTP,
    ResendOTP,
    Login,
    Profile,
    Logout,
    ForgotPassword,
    ResetPassword,
    UpdateProfile,
    UpdatePassword,
    DeleteAccount,
    DeactivateAccount,
    RefreshAccessToken,
} from "../../controller/authController/auth.controller.js";

const router = express.Router();

// ───────── public ─────────
router.post("/signup", signupLimiter, signupValidator, validate, Signup);
router.post("/verify-otp", verifyOtpLimiter, verifyOtpValidator, validate, VerifyOTP);
router.post("/resend-otp", resendOtpLimiter, resendOtpValidator, validate, ResendOTP);
router.post("/login", loginLimiter, loginValidator, validate, Login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordValidator, validate, ForgotPassword);
router.post("/reset-password", resetPasswordLimiter, resetPasswordValidator, validate, ResetPassword);
router.post("/refresh-token", refreshTokenLimiter, RefreshAccessToken);
router.post("/logout", logoutLimiter, Logout);

// ───────── authenticated ─────────
router.get("/profile", authMiddleware, Profile);
router.patch("/update-profile", authMiddleware, updateProfileValidator, validate, UpdateProfile);
router.patch("/change-password", authMiddleware, changePasswordLimiter, changePasswordValidator, validate, UpdatePassword);
router.patch("/deactivate-account", authMiddleware, sensitiveActionLimiter, DeactivateAccount);
router.delete("/delete-account", authMiddleware, sensitiveActionLimiter, deleteAccountValidator, validate, DeleteAccount);

export default router;
