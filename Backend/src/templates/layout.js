import { escapeHtml } from "../utils/escapeHtml.js";

/** Shared email shell so every message looks consistent. */
export const emailLayout = (title, bodyHtml) => `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;color:#12182b;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:32px 12px;">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;padding:36px;">
        <tr><td>
          <div style="font-size:20px;font-weight:700;color:#0b6e6e;margin-bottom:24px;">Trimly</div>
          ${bodyHtml}
          <hr style="border:none;border-top:1px solid #e3e7ef;margin:28px 0 14px;">
          <p style="font-size:12px;color:#7a8396;margin:0;">This is an automated message. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const otpBox = (otp) =>
    `<div style="margin:28px 0;text-align:center;font-size:34px;font-weight:700;letter-spacing:10px;font-family:'Courier New',monospace;background:#f3f6fa;border-radius:10px;padding:18px 0;">${escapeHtml(otp)}</div>`;
