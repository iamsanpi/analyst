const { ConversationClient } = require('anthropic');

const client = new ConversationClient({ apiKey: 'sk-Q6KKyhUNwMuUBrU3J6UFWR8t9YSNrzD4IQy1fO8zrZy6rXBd' });

const dataAnalysisPrompt = `
你是一个数据分析专家,接下来我会给你一些数据,请你分析这些数据并给出洞见和建议。
要求:
1. 从数据中提取关键指标,并分析指标的趋势和变化
2. 解释造成这些趋势和变化的可能原因
3. 针对分析结果,给出可操作的优化建议
4. 用markdown格式返回,不少于5条洞见或建议
`;

async function getGPTAnalyze(data) {
  const response = await client.sendMessage(dataAnalysisPrompt + JSON.stringify(data));
  return response.text;
}

module.exports = async function (req, res) {
  const { data } = req.body;

  try {
    const analysis = await getGPTAnalyze(data);
    res.json({ analysis });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to analyze data' });
  }
};