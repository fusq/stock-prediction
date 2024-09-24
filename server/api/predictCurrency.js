import axios from 'axios';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const { baseCurrency, targetCurrency } = query;

    if (!baseCurrency || !targetCurrency) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Base and target currencies are required',
        });
    }

    try {
        // Fetch latest currency data from exchangeratesapi
        const response = await axios.get(`http://api.exchangeratesapi.io/v1/latest`, {
            params: {
                access_key: 'e634038ebf6fc5edb05deb0140da1f62',
                base: baseCurrency,
                symbols: targetCurrency
            }
        });

        const rate = response.data.rates[targetCurrency];

        // Generate mock historical data
        const ratesData = [];
        for (let i = 99; i >= 0; i--) {
            const randomChange = (Math.random() - 0.5) * 0.02; // Random change between -1% and 1%
            ratesData.push(rate * (1 + randomChange));
        }

        // Call the Flask API with the currency data
        const flaskResponse = await axios.post('https://pythonscripttradeprediction-pajd.vercel.app/predict', {
            serie: ratesData,
            horizon: 10,
            output: 'TcopilValues'
        });

        const prediction = flaskResponse.data;

        return {
            baseCurrency,
            targetCurrency,
            rates: ratesData,
            prediction: prediction
        };
    } catch (error) {
        console.error('Error fetching currency data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Error fetching currency data',
        });
    }
});