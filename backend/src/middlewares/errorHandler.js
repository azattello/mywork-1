module.exports = (err, req, res, next) => {
  console.error(err);
  // Multer file size / multer errors => respond 400
  if (err && (err.code === 'LIMIT_FILE_SIZE' || err.name === 'MulterError')) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : err.message;
    return res.status(400).json({ success: false, message });
  }
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Server error' });
};
