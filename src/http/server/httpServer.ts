import http from "http";
import { createHttpTerminator } from "http-terminator";
import { logger } from "../../util/logger";
import { AppError } from "../../shared/error";

const DEFAULT_PORT = 5000;

function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 0 && port <= 65535;
}

/**
 * Starts the HTTP server with the provided Express app and port.
 * @param app - The Express application instance.
 * @param port - The port to listen on (defaults to 5000).
 */
export function StartServer(app: Express.Application, port: number = DEFAULT_PORT): void {
  if (!isValidPort(port)) {
    throw new AppError({
      message: "Invalid port number",
      description: `Port must be an integer between 0 and 65535. Received: ${port}`,
      type: "HTTP Server Configuration Error",
    });
  }

  const server = http.createServer(app);
  const httpTerminator = createHttpTerminator({ server });

  const shutdown = async () => {
    logger.info("Shutting down gracefully...");
    await httpTerminator.terminate();
    logger.info("Server closed.");
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("unhandledRejection", async (err) => {
    logger.error("Unhandled Rejection:", err);
    await shutdown();
  });
  process.on("uncaughtException", async (err) => {
    logger.error("Uncaught Exception:", err);
    await shutdown();
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      logger.error(`Port ${port} is already in use. Please choose another port.`);
    } else {
      logger.error(`Server error: ${error.message}`, error);
    }
    process.exit(1);
  });

  server.listen(port, () => {
    logger.info(`App running on http://localhost:${port}`);
  });
}