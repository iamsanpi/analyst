const express = require('express');
const path = require('path');
const getGPTSQLQuery = require('./api/getGPTSQLQuery');
const getGPTAnalyze = require('./api/getGPTAnalyze');
const getGPTSQLAnalyze = require('./api/getGPTSQLAnalyze');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/getGPTSQLQuery', getGPTSQLQuery);
app.use('/api/getGPTAnalyze', getGPTAnalyze);
app.use('/api/getGPTSQLAnalyze', getGPTSQLAnalyze);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});