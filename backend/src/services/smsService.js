const crypto = require('crypto');

const getProvider = () => process.env.SMS_PROVIDER || (process.env.NODE_ENV === 'production' ? 'none' : 'development');

const sendSms = async (phone, message) => {
  const provider = getProvider();

  if (provider === 'development') {
    if (process.env.NODE_ENV === 'production') throw new Error('Development SMS provider is disabled in production');
    return { delivered: false, development: true };
  }

  if (provider === 'twilio') {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM) {
      throw new Error('Twilio SMS provider is not configured');
    }
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const body = new URLSearchParams({ To: phone, From: process.env.TWILIO_FROM, Body: message });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) throw new Error('SMS provider rejected the message');
    return { delivered: true };
  }

  throw new Error('SMS provider is not configured');
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const hashOtp = (otp) => crypto.createHash('sha256').update(`${otp}:${process.env.JWT_SECRET || 'development-secret'}`).digest('hex');

module.exports = { generateOtp, hashOtp, sendSms };