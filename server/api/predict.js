import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pythonScriptPath = join(__dirname, '..', '..', 'server', 'api', 'stock_predictor.py');

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const symbol = query.symbol

    if (!symbol) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Symbol is required',
        })
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

        // Call the Python script with the stock data
        const pythonProcess = spawn('python', [pythonScriptPath]);

        pythonProcess.stdin.write(JSON.stringify(stockData));
        pythonProcess.stdin.end();

        let prediction = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            prediction += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        return new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        symbol: symbol,
                        prices: stockData,
                        prediction: JSON.parse(prediction)
                    });
                } else {
                    console.error('Python script error output:', errorOutput);
                    reject(new Error(`Python script exited with code ${code}. Error: ${errorOutput}`));
                }
            });
        });
    } catch (error) {
        console.error('Error fetching stock data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Error fetching stock data',
        });
    }
})