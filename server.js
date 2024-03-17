const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/user');

const app = express();

app.use(express.json());

// 连接到 MongoDB 数据库
mongoose.connect('mongodb://localhost:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// 处理 SQL 分析请求的路由
app.post('/api/getGPTSQLAnalyze', async (req, res) => {
  const { tableSchema, userInput } = req.body;

  try {
    // 使用 Claude 生成 SQL 查询语句
    const { sqlQuery, results } = await getGPTSQLQuery(tableSchema, userInput);

    // 使用 Claude 分析查询结果
    const analysis = await getGPTAnalyze(sqlQuery, results);

    res.json({ sqlQuery, results, analysis });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function getGPTSQLQuery(tableSchema, userInput) {
  // ... (保持不变)

  const sqlQuery = response.data.completion.trim();

  // 执行 SQL 查询并获取结果
  const results = await executeSQLQuery(sqlQuery);

  return { sqlQuery, results };
}

async function executeSQLQuery(sqlQuery) {
  // ... (保持不变)
}

async function getGPTAnalyze(sqlQuery, results) {
  // ... (保持不变)
}

// 启动服务器
app.listen(3001, () => {
  console.log('Server is running on port 3001');
});