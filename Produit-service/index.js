const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
const dbName = 'userServiceDB';
const secret = 'secretKey';

client.connect();
const db = client.db(dbName);
const produits = db.collection('produits');

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(403);
  const token = auth.split(' ')[1];
  jwt.verify(token, secret, (err) => {
    if (err) return res.sendStatus(403);
    next();
  });
}

app.use(authenticate);

app.get('/produit/:id', async (req, res) => {
  const prod = await produits.findOne({ _id: new ObjectId(req.params.id) });
  prod ? res.json(prod) : res.sendStatus(404);
});

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