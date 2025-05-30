require('dotenv').config(); // charge .env

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const authMiddleware = require('../User-service/middleware/auth'); // middleware importé

const app = express();
app.use(express.json());

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
const dbName = 'userServiceDB';

client.connect();
const db = client.db(dbName);
const produits = db.collection('produits');

app.use(authMiddleware); // applique le middleware JWT


app.post('/ajouter', async (req, res) => {
  await produits.insertOne({ ...req.body, created_at: new Date() });
  res.sendStatus(200);
});

app.put('/:id', async (req, res) => {
  const result = await produits.updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
  result.matchedCount ? res.sendStatus(200) : res.sendStatus(404);
});

app.delete('/:id', async (req, res) => {
  const result = await produits.deleteOne({ _id: new ObjectId(req.params.id) });
  result.deletedCount ? res.sendStatus(200) : res.sendStatus(404);
});

app.get('/produit/recherche', async (req, res) => {
  const { motcle } = req.query;
  const result = await produits.find({
    $or: [
      { nom: { $regex: motcle, $options: 'i' } },
      { categorie: { $regex: motcle, $options: 'i' } }
    ]
  }).toArray();
  res.json(result);
});

app.get('/produit/:id', async (req, res) => {
  const prod = await produits.findOne({ _id: new ObjectId(req.params.id) });
  prod ? res.json(prod) : res.sendStatus(404);
});

app.put('/produit/stock/:id', async (req, res) => {
  const { stock } = req.body;
  const result = await produits.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { stock } });
  result.matchedCount ? res.sendStatus(200) : res.sendStatus(404);
});

app.get('/produits/rupture', async (req, res) => {
  const result = await produits.find({ stock: { $lte: 0 } }).toArray();
  res.json(result);
});

app.listen(3002, () => console.log('Service de produit disponible sur le port 3002'));