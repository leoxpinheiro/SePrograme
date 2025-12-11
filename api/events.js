const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  const filePath = path.join(process.cwd(), "data", "events.json");
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  res.status(200).json(json.events);
};
