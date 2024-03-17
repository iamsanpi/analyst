const mongoose = require('mongoose');

async function getTableSchema() {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const tableSchema = {};

  for (const collection of collections) {
    const collectionName = collection.name;
    const schema = await mongoose.connection.db.collection(collectionName).findOne();
    tableSchema[collectionName] = Object.keys(schema).filter(key => key !== '_id');
  }

  return tableSchema;
}

module.exports = getTableSchema;