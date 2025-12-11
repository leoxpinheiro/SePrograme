const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "data", "events.json");
    if (!fs.existsSync(filePath)) {
      // cria arquivo vazio caso não exista
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({ events: [] }, null, 2));
    }
    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return res.status(200).json(json.events || []);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao ler eventos" });
  }
};
