import "dotenv/config";
import http from "http";
import "./extractText.worker";
import "./reminders.worker";
import "./scoreClause.worker";

console.log(
  "Worker process started. extractText, reminders, and scoreClause workers are listening.",
);

// Spin up a tiny HTTP server on the port Render assigns us
// This tricks Render into thinking this is a standard "Web Service", allowing it to run on the Free Tier!
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Worker is active and healthy!\n");
});

server.listen(PORT, () => {
  console.log(
    `Dummy HTTP server running on port ${PORT} to pass Render health checks.`,
  );
});
