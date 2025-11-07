/**
 * @desc Custom error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // If status code is 200, set it to 500 (server error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json({
    message: err.message,
    // Show stack trace only if in development mode
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};