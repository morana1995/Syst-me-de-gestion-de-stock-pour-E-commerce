require('dotenv').config(); // Charge les variables d'environnement

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const authMiddleware = require('../User-service/middleware/auth'); // Middleware JWT

const app = express();
app.use(express.json());

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);
const dbName = 'userServiceDB';

let ventes;

client.connect()
  .then(() => {
    const db = client.db(dbName);
    ventes = db.collection('ventes');
    console.log('Connexion à MongoDB réussie pour vente-service');
  })
  .catch(err => {
    console.error('Erreur de connexion MongoDB:', err);
  });

// Middleware d'authentification
app.use(authMiddleware);

/**
 * POST /vente
 * Enregistrer une vente
 * Body: { idProduit, quantité, vendeurEmail }
 */
app.post('/vente', async (req, res) => {
  const { idProduit, quantité, vendeurEmail } = req.body;
  if (!idProduit || !quantité || !vendeurEmail) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }
   console.log("Données reçues :", req.body);

  const nouvelleVente = {
    idProduit,
    quantité,
    vendeurEmail,
    date: new Date()
  };

  await ventes.insertOne(nouvelleVente);
  res.sendStatus(200);
});

/**
 * GET /vente/date?jour=AAAA-MM-JJ
 * Afficher les ventes d’un jour donné
 */
app.get('/vente/date', async (req, res) => {
  console.log("Route /vente/date appelée avec jour =", req.query.jour);
  const { jour } = req.query;
  if (!jour) return res.status(400).json({ message: 'Paramètre "jour" requis' });

  const dateDebut = new Date(jour);
  const dateFin = new Date(jour);
  dateFin.setDate(dateFin.getDate() + 1);

  const ventesJour = await ventes.find({
    date: { $gte: dateDebut, $lt: dateFin }
  }).toArray();

  res.status(200).json(ventesJour);
});


/**
 * GET /vente/:email
 * Lister les ventes d’un utilisateur
 */
app.get('/vente/:email', async (req, res) => {
  const ventesUser = await ventes.find({ vendeurEmail: req.params.email }).toArray();
  if (ventesUser.length === 0) {
    return res.sendStatus(404);
  }
  res.status(200).json(ventesUser);
});

/**
 * DELETE /vente/:id
 * Annuler une vente
 */
app.delete('/vente/:id', async (req, res) => {
  const result = await ventes.deleteOne({ _id: new ObjectId(req.params.id) });
  result.deletedCount ? res.sendStatus(200) : res.sendStatus(404);
});


/**
 * GET /vente/total/:email
 * Total des ventes par utilisateur (quantité)
 */
app.get('/vente/total/:email', async (req, res) => {
  const { email } = req.params;

  const aggregation = await ventes.aggregate([
    { $match: { vendeurEmail: email } },
    {
      $group: {
        _id: '$vendeurEmail',
        totalVentes: { $sum: '$quantité' }
      }
    }
  ]).toArray();

  if (aggregation.length === 0) return res.sendStatus(404);
  res.status(200).json({ email, total: aggregation[0].totalVentes });
});

app.listen(3003, () => {
  console.log('Service de vente en écoute sur le port 3003');
});
