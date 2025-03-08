import { StartServer } from "./http/server/httpServer";
import { initializeApp } from "./start";
import { env } from "./config/env";

async function main() {
    try {
        const app = await initializeApp();
        StartServer(app, Number(env.port));
    } catch (error) {
        console.error("Failed to start the application:", error);
        process.exit(1);
    }
}

main();
