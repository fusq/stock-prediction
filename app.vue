<template>
    <div class="flex flex-col h-screen bg-gray-100 justify-center items-center text-sm">
        <div class="w-full h-full md:max-w-2xl md:h-[800px] bg-white rounded-lg shadow-sm flex flex-col">
            <div class="flex-grow overflow-y-auto p-4 space-y-4" ref="messagesContainer">
                <div v-for="(msg, index) in messages" :key="index"
                    :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
                    <div :class="[
                        'max-w-xs rounded-lg p-3',
                        msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'
                    ]">
                        <span v-html="formatMessage(msg.content)"></span>
                    </div>
                </div>
            </div>
            <div v-if="showChart" class="h-[300px] p-4 relative">
                <button @click="showChart = false" class="absolute top-6 right-6 text-gray-600 hover:text-gray-800">
                    <Icon name="heroicons:x-mark" class="w-4 h-4 text-gray-600 hover:text-gray-800" />
                </button>
                <PredictionChart :historicalData="historicalData" :predictedData="predictedData"
                    :primaryLabel="chartType === 'stock' ? currentSymbol : baseCurrency"
                    :secondaryLabel="chartType === 'currency' ? targetCurrency : ''" :chartType="chartType" />
            </div>
            <div class="border-t rounded-b-lg bg-white p-4">
                <div class="flex space-x-2">
                    <input v-model="userInput" @keyup.enter="sendMessage"
                        class="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                        placeholder="Type your message...">
                    <button @click="sendMessage"
                        class="bg-gray-800 text-white rounded-full px-4 py-2 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-800">
                        <Icon name="heroicons:paper-airplane-solid" class="w-4 h-4 block" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const messages = ref([])
const userInput = ref('')
const showChart = ref(false)
const historicalData = ref([])
const predictedData = ref([])
const currentSymbol = ref('')
const chartType = ref('')
const baseCurrency = ref('')
const targetCurrency = ref('')

const formatMessage = (content) => {
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
}

const sendMessage = async () => {
    if (!userInput.value.trim()) return

    const message = userInput.value
    userInput.value = '' // Clear the input immediately after getting the message

    messages.value.push({ role: 'user', content: message })

    try {
        const response = await $fetch('/api/chat', {
            method: 'POST',
            body: { message: message }
        })

        if (response.reply.trim()) {
            messages.value.push({ role: 'assistant', content: response.reply })
        }

        if (response.needsPrediction) {
            if (response.stockSymbol) {
                messages.value.push({ role: 'assistant', content: `Fetching stock data for ${response.stockSymbol}...` })
                try {
                    const predictionResponse = await $fetch('/api/predict', {
                        method: 'GET',
                        params: { symbol: response.stockSymbol }
                    })

                    historicalData.value = predictionResponse.prices
                    predictedData.value = predictionResponse.prediction.values
                    currentSymbol.value = predictionResponse.symbol
                    chartType.value = 'stock'
                    showChart.value = true

                    messages.value.push({ role: 'assistant', content: `I've created a chart showing the historical data and prediction for ${predictionResponse.symbol}. You can see it below.` })

                    const tendencyMessage = `Predicted tendency: **${predictionResponse.prediction.tendency[0] === 1 ? 'Upward' : 'Downward'}**`
                    messages.value.push({ role: 'assistant', content: tendencyMessage })
                } catch (error) {
                    messages.value.push({ role: 'assistant', content: `Error fetching stock data: ${error.message}` })
                }
            } else if (response.baseCurrency && response.targetCurrency) {
                messages.value.push({ role: 'assistant', content: `Fetching currency data for ${response.baseCurrency}/${response.targetCurrency}...` })
                try {
                    const predictionResponse = await $fetch('/api/predictCurrency', {
                        method: 'GET',
                        params: { baseCurrency: response.baseCurrency, targetCurrency: response.targetCurrency }
                    })

                    historicalData.value = predictionResponse.rates
                    predictedData.value = predictionResponse.prediction.values
                    baseCurrency.value = predictionResponse.baseCurrency
                    targetCurrency.value = predictionResponse.targetCurrency
                    chartType.value = 'currency'
                    showChart.value = true

                    messages.value.push({ role: 'assistant', content: `I've created a chart showing the historical data and prediction for ${predictionResponse.baseCurrency}/${predictionResponse.targetCurrency}. You can see it below.` })

                    const tendencyMessage = `Predicted tendency: **${predictionResponse.prediction.tendency[0] === 1 ? 'Upward' : 'Downward'}**`
                    messages.value.push({ role: 'assistant', content: tendencyMessage })
                } catch (error) {
                    messages.value.push({ role: 'assistant', content: `Error fetching currency data: ${error.message}` })
                }
            }
        }
    } catch (error) {
        console.error('Error sending message:', error)
        messages.value.push({ role: 'assistant', content: 'Sorry, there was an error processing your request.' })
    }
}

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

const messagesContainer = ref(null)

watch(messages, () => {
    nextTick(() => {
        scrollToBottom()
    })
}, { deep: true })

watch(showChart, () => {
    nextTick(() => {
        scrollToBottom()
    })
})

onMounted(() => {
    scrollToBottom()
})
</script>