const mongoose = require('mongoose'); 
mongoose.connect('mongodb://theoptimeio_db_user:tCAPxmopLaktTEr3@ac-kvqhfzh-shard-00-00.zypxwfm.mongodb.net:27017,ac-kvqhfzh-shard-00-01.zypxwfm.mongodb.net:27017,ac-kvqhfzh-shard-00-02.zypxwfm.mongodb.net:27017/?ssl=true&replicaSet=atlas-muadit-shard-0&authSource=admin&appName=Cluster0').then(async () => { 
  console.time('query'); 
  const products = await mongoose.connection.db.collection('products').find({}, { projection: { name: 1, price: 1, 'images': { $slice: 1 } } }).toArray(); 
  console.timeEnd('query'); 
  console.log('Products:', products.length); 
  process.exit(); 
});
