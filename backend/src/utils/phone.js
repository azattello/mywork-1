const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  return value ? `+${digits}` : '';
};

const maskPhone = (phone) => phone ? `${phone.slice(0, 2)} *** *** ** ${phone.slice(-2)}` : '';

module.exports = { normalizePhone, maskPhone };