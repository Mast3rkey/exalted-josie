import "dotenv/config";
import { issueDownloadToken } from "../lib/downloadTokens";

async function main() {
  const token = await issueDownloadToken({
    stripeSessionId: "test_session",
    customerEmail: "test@example.com",
    hoursValid: 48,      // token valid for 48 hours
    maxDownloads: 3,     // allow 3 downloads
  });

  console.log("Generated token:");
  console.log(token);
}

main().catch((err) => {
  console.error("Error generating token:", err);
  process.exit(1);
});
