import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data", "events.json");
  const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  res.status(200).json(json.events);
}
