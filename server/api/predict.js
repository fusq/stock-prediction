import axios from 'axios';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const symbol = query.symbol;

    if (!symbol) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Symbol is required',
        });
    }

    try {
        // Fetch stock data from marketstack API
        const response = await axios.get(`http://api.marketstack.com/v1/eod`, {
            params: {
                access_key: '0cd164ee6ce8678562307682f80fd00d',
                symbols: symbol,
                limit: 100
            }
        });

        const stockData = response.data.data.map(item => item.close).reverse();

        // Call the Flask API with the stock data
        const flaskResponse = await axios.post('https://pythonscripttradeprediction-pajd.vercel.app/predict', {
            serie: stockData,
            horizon: 10,
            output: 'TcopilValues'
        });

        const prediction = flaskResponse.data;

        return {
            symbol: symbol,
            prices: stockData,
            prediction: prediction
        };
    } catch (error) {
        console.error('Error fetching stock data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Error fetching stock data',
        });
    }
});