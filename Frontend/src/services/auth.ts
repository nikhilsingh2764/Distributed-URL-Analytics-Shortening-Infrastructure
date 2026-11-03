import api, { unwrap } from "../lib/api";
import type { User } from "../lib/types";

export const authService = {
  signup: (body: { username: string; email: string; password: string }) =>
    unwrap<{ email: string }>(api.post("/auth/signup", body)),
  verifyOtp: (body: { email: string; otp: string }) => unwrap<User>(api.post("/auth/verify-otp", body)),
  resendOtp: (email: string) => unwrap<{ email: string }>(api.post("/auth/resend-otp", { email })),
  login: (body: { email: string; password: string }) => unwrap<User>(api.post("/auth/login", body)),
  logout: () => unwrap<null>(api.post("/auth/logout")),
  profile: () => unwrap<User>(api.get("/auth/profile")),
  forgotPassword: (email: string) => unwrap<null>(api.post("/auth/forgot-password", { email })),
  resetPassword: (body: { email: string; otp: string; newPassword: string }) =>
    unwrap<null>(api.post("/auth/reset-password", body)),
  updateProfile: (username: string) => unwrap<User>(api.patch("/auth/update-profile", { username })),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    unwrap<null>(api.patch("/auth/change-password", body)),
  deactivate: () => unwrap<null>(api.patch("/auth/deactivate-account")),
  deleteAccount: (password: string) => unwrap<null>(api.delete("/auth/delete-account", { data: { password } })),
};
