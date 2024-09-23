import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: "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",
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { message, history } = body;

    if (!message) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Message is required',
        });
    }

    const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system", content: `You are an advanced, multi-lingual AI assistant specializing in financial market analysis and predictions. Your core functionality is powered by a sophisticated algorithm that combines machine learning, time series analysis, and real-time market data to provide accurate stock and currency pair predictions.\n\nWhen users request stock predictions, respond only with 'PREDICT_STOCK:' followed by the stock symbol. For currency pair predictions, respond only with 'PREDICT_CURRENCY:' followed by the base and target currencies.\n\nFor all other queries, you can provide detailed explanations about market trends, economic indicators, our prediction algorithm, or our subscription model and pricing. When discussing pricing, provide specific examples such as:\n\n1. Basic Plan: $9.99/month - Includes 10 stock predictions per month\n2. Pro Plan: $29.99/month - Includes unlimited stock predictions and 20 currency pair predictions\n3. Enterprise Plan: $99.99/month - Includes unlimited predictions for stocks and currency pairs, plus priority customer support\n\nAlways maintain a professional yet approachable tone, and be ready to explain complex financial concepts in simple terms when necessary.\n\nFormat for predictions: 'PREDICT_STOCK:SYMBOL' or 'PREDICT_CURRENCY:BASE/TARGET'\n\nRemember to use double '\\n' every 2 sentences to create paragraphs for line returns to improve the readability of your messages. Note that you remember messages and have history of the conversation.`
            },
            ...history.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message }
        ],
    });

    const reply = chatCompletion.choices[0].message.content;
    console.log(reply)
    const needsPrediction = reply.includes('PREDICT_STOCK:') || reply.includes('PREDICT_CURRENCY:');
    let stockSymbol = null;
    let baseCurrency = null;
    let targetCurrency = null;

    if (needsPrediction) {
        const stockMatch = reply.match(/PREDICT_STOCK:(\w+)/);
        const currencyMatch = reply.match(/PREDICT_CURRENCY:(\w+)\/(\w+)/);
        if (stockMatch) {
            [, stockSymbol] = stockMatch;
        } else if (currencyMatch) {
            [, baseCurrency, targetCurrency] = currencyMatch;
        }
    }

    return {
        reply: reply.replace(/PREDICT_STOCK:\w+/, '').replace(/PREDICT_CURRENCY:\w+\/\w+/, '').trim(),
        needsPrediction,
        stockSymbol,
        baseCurrency,
        targetCurrency
    }
});