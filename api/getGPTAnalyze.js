const { ConversationClient } = require('anthropic');

const dataAnalysisPrompt = `
你是一个数据分析专家,接下来我会给你一些数据,请你分析这些数据并给出洞见和建议。
要求:
1. 从数据中提取关键指标,并分析指标的趋势和变化
2. 解释造成这些趋势和变化的可能原因
3. 针对分析结果,给出可操作的优化建议
4. 用markdown格式返回,不少于5条洞见或建议
`;

async function getGPTAnalyze(data, apiKey) {
  const client = new ConversationClient({ apiKey });
  const response = await client.sendMessage(dataAnalysisPrompt + JSON.stringify(data));
  return response.text;
}

module.exports = async function (req, res) {
  const { data } = req.body;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return res.status(503).json({ error: 'AI service is not configured' });
    }
    const analysis = await getGPTAnalyze(data, apiKey);
    res.json({ analysis });
  } catch (error) {
    console.error('Anthropic request failed');
    res.status(500).json({ error: 'Failed to analyze data' });
  }
};
