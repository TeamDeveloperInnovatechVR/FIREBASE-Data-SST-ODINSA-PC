const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.rankingTrainings = functions.https.onRequest(async (req, res) => {
  // 🔹 Cabeceras CORS
  res.set('Access-Control-Allow-Origin', '*'); // Permite todos los orígenes
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');  
    if (req.method === 'OPTIONS') {
    // Responde preflight requests
    res.status(204).send('');
    return;
  }
try {
    const db = admin.database();
    const snapshot = await db.ref("Companies").once("value");
    const companies = snapshot.val();

    if (!companies) {
      return res.json({ success: true, total: 0, ranking: [] });
    }

    const ranking = {};

    for (const companyKey in companies) {
      const company = companies[companyKey];
      const devices = company.Devices || {};

      for (const deviceKey in devices) {
        const device = devices[deviceKey];
        const trainings = device.Trainings || [];

        trainings.forEach(training => {
          if (!training || !training.TrainingName || !training.TotalTime) return;

          const name = training.TrainingName;
          const time = Number(training.TotalTime) || 0;

          if (!ranking[name]) ranking[name] = 0;
          ranking[name] += time;
        });
      }
    }

    // Convertir a array y ordenar de mayor a menor
    const rankingArray = Object.entries(ranking)
      .map(([name, time]) => ({ name, time }))
      .sort((a, b) => b.time - a.time);

    res.json({ success: true, total: rankingArray.length, ranking: rankingArray });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});
