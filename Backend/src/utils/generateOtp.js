import crypto from "crypto";

/** Cryptographically secure 6-digit code (100000–999999). */
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

export default generateOtp;
