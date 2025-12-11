const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const filePath = path.join(process.cwd(), "data", "events.json");
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({ events: [] }, null, 2));
    }

    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const newEvent = { id: Date.now(), ...req.body };
    json.events = json.events || [];
    json.events.push(newEvent);
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    return res.status(200).json({ success: true, event: newEvent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao adicionar evento" });
  }
};
