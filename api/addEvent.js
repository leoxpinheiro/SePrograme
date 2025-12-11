const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const filePath = path.join(process.cwd(), "data", "events.json");
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const newEvent = {
    id: Date.now(),
    ...req.body,
  };

  json.events.push(newEvent);

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));

  res.status(200).json({ success: true, event: newEvent });
};
