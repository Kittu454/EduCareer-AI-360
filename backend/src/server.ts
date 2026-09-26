import app from './app.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  logger.info(`EduCareer AI 360 Backend starting on port ${PORT}`);
});
