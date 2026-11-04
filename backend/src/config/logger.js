const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.token',
      'body.studentName',
      'body.rollNumber',
      'body.phoneNumber',
      'body.dob',
      '*.studentName',
      '*.rollNumber'
    ],
    remove: false,
    censor: '[REDACTED_PII]'
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
          ignore: 'pid,hostname'
        }
      }
    : undefined
});

module.exports = logger;
