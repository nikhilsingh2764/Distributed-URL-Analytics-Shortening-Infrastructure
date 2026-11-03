import { escapeHtml } from "../utils/escapeHtml.js";
import { emailLayout } from "./layout.js";

const welcomeTemplate = (username, clientUrl = "") =>
    emailLayout(
        "Welcome to Trimly",
        `<h2 style="margin:0 0 12px;">Welcome, ${escapeHtml(username)}!</h2>
         <p>Your email is verified and your account is ready.</p>
         <p>Paste a long link, get a short one, and watch the clicks come in — with browser, device, country and referrer breakdowns for every link.</p>
         ${
             clientUrl
                 ? `<p style="margin:24px 0;"><a href="${escapeHtml(clientUrl)}" style="background:#0b6e6e;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">Open your dashboard</a></p>`
                 : ""
         }`
    );

export default welcomeTemplate;
