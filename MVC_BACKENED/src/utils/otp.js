import crypto from 'crypto';

export const generateOTP = () =>
  crypto.randomInt(100000, 999999).toString();

export const getOTPExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
};