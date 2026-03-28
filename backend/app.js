require("dotenv").config();
const app = require("./server.js");
const connectToDb = require("./config/db.js");

const PORT = Number(process.env.PORT) || 8080;

async function startServer() {
    try {
        await connectToDb(); // connect first

        app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();