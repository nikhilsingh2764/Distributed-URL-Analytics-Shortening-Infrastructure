import { escapeHtml } from "../utils/escapeHtml.js";
import { emailLayout, otpBox } from "./layout.js";

const otpTemplate = (username, otp, minutes = 10) =>
    emailLayout(
        "Verify your email",
        `<h2 style="margin:0 0 12px;">Verify your email</h2>
         <p>Hi <strong>${escapeHtml(username)}</strong>, use this code to finish creating your account:</p>
         ${otpBox(otp)}
         <p>The code expires in <strong>${minutes} minutes</strong>. If you didn't sign up, you can ignore this email.</p>`
    );

export default otpTemplate;
