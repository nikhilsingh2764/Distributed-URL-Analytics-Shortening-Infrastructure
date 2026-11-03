import TryCatch from "../../middleware/TryCatch.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
    accessTokenOptions,
    refreshTokenOptions,
    accessTokenClearOptions,
    refreshTokenClearOptions,
} from "../../utils/cookieOptions.js";
import * as authService from "../../service/authService/auth.service.js";

const setAuthCookies = (res, { accessToken, refreshToken }) => {
    res.cookie("accessToken", accessToken, accessTokenOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenOptions);
};

const clearAuthCookies = (res) => {
    res.clearCookie("accessToken", accessTokenClearOptions);
    res.clearCookie("refreshToken", refreshTokenClearOptions);
};

const send = (req, res, status, key, data = null) =>
    res.status(status).json(new ApiResponse(status, req.t(key), data));

export const Signup = TryCatch(async (req, res) => {
    send(req, res, 201, "otp_sent", await authService.signupService(req.body));
});

export const VerifyOTP = TryCatch(async (req, res) => {
    send(req, res, 201, "user_created", await authService.verifyOtpService(req.body));
});

export const ResendOTP = TryCatch(async (req, res) => {
    send(req, res, 200, "otp_resent", await authService.resendOtpService(req.body));
});

export const Login = TryCatch(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.loginService(req.body, req.get("user-agent"));
    setAuthCookies(res, { accessToken, refreshToken });
    send(req, res, 200, "login_success", user);
});

export const RefreshAccessToken = TryCatch(async (req, res) => {
    try {
        const tokens = await authService.refreshAccessTokenService(req.cookies?.refreshToken, req.get("user-agent"));
        setAuthCookies(res, tokens);
        send(req, res, 200, "token_refreshed");
    } catch (error) {
        clearAuthCookies(res); // a bad refresh token is useless: don't keep resending it
        throw error;
    }
});

// Public on purpose: it must still work when the access token has already expired.
export const Logout = TryCatch(async (req, res) => {
    await authService.logoutService(req.cookies?.refreshToken);
    clearAuthCookies(res);
    send(req, res, 200, "logout_success");
});

export const Profile = TryCatch(async (req, res) => {
    send(req, res, 200, "profile_success", await authService.profileService(req.user));
});

export const UpdateProfile = TryCatch(async (req, res) => {
    send(req, res, 200, "profile_updated", await authService.updateProfileService(req.user._id, req.body));
});

export const UpdatePassword = TryCatch(async (req, res) => {
    const tokens = await authService.changePasswordService(req.user._id, req.body, req.get("user-agent"));
    setAuthCookies(res, tokens);
    send(req, res, 200, "password_changed");
});

export const ForgotPassword = TryCatch(async (req, res) => {
    await authService.forgotPasswordService(req.body);
    send(req, res, 200, "password_reset_requested");
});

export const ResetPassword = TryCatch(async (req, res) => {
    await authService.resetPasswordService(req.body);
    send(req, res, 200, "password_reset");
});

export const DeactivateAccount = TryCatch(async (req, res) => {
    await authService.deactivateAccountService(req.user._id);
    clearAuthCookies(res);
    send(req, res, 200, "account_deactivated");
});

export const DeleteAccount = TryCatch(async (req, res) => {
    await authService.deleteAccountService(req.user._id, req.body.password);
    clearAuthCookies(res);
    send(req, res, 200, "account_deleted");
});
