import w from "winston";

w.addColors({
  info: "green",
  error: "red",
  warn: "yellow",
  debug: "blue",
});

const customFormat = w.format.printf(({ timestamp, level, message }) => {
  return `${level}: ${message}\t at:${timestamp}\n`;
});

export const logger = w.createLogger({
  level: "debug",
  format: w.format.combine(
    w.format.timestamp(),
    w.format.colorize(),
    customFormat,
  ),
  transports: [
    new w.transports.Console({
      format: w.format.combine(w.format.colorize(), customFormat),
    }),
    new w.transports.File({
      filename: "logs/app.log",
      level: "info",
      format: customFormat,
    }),
  ],
});
