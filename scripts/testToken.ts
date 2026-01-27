import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createDownloadToken } from "../lib/downloadTokens";

const token = createDownloadToken(48); // 48 hours
console.log(token);
