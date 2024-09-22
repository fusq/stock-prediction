import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: "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",
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { message } = body

    if (!message) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Message is required',
        })
    }

    const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful assistant that can provide stock predictions. When a user asks for a stock prediction, include the phrase 'PREDICT_STOCK:' followed by the stock symbol in your response. Format: 'PREDICT_STOCK:SYMBOL'" },
            { role: "user", content: message }
        ],
    });

    const reply = chatCompletion.choices[0].message.content;
    const needsPrediction = reply.includes('PREDICT_STOCK:');
    let stockSymbol = null;

    if (needsPrediction) {
        const match = reply.match(/PREDICT_STOCK:(\w+)/);
        if (match) {
            [, stockSymbol] = match;
        }
    }

    return {
        reply: reply.replace(/PREDICT_STOCK:\w+/, '').trim(),
        needsPrediction,
        stockSymbol
    }
})