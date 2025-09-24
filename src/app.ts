import { migrate, seed } from "#postgres/knex.js";
import Bree from "bree";
import path from "node:path";
import { fileURLToPath } from "node:url";

await migrate.latest();
await seed.run();

console.log("All migrations and seeds have been run");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === "production" || __dirname.endsWith("/dist");
const jobsRoot = isProd ? path.join(__dirname, "jobs") : path.join(__dirname, "jobs");

const bree = new Bree({
    root: jobsRoot,
    defaultExtension: process.env.TS_NODE ? "ts" : "js",
    acceptedExtensions: [".ts", ".js"],
    jobs: [
        {
            name: "update-wb-data",
            cron: "0 * * * *", // каждый час
            path: path.join(jobsRoot, "updateWbData" + (isProd ? ".js" : ".ts")),
        },
    ],
});

await bree.start();
