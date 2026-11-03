import { emailLayout, otpBox } from "./layout.js";

const resetPasswordTemplate = (otp, minutes = 10) =>
    emailLayout(
        "Reset your password",
        `<h2 style="margin:0 0 12px;">Reset your password</h2>
         <p>Enter this code to choose a new password:</p>
         ${otpBox(otp)}
         <p>The code expires in <strong>${minutes} minutes</strong>. If you didn't ask for this, your password is unchanged and you can ignore this email.</p>`
    );

export default resetPasswordTemplate;
