<template>
    <div class="flex flex-col h-screen bg-gray-100 justify-center items-center text-sm">
        <div class="w-full max-w-2xl bg-white rounded-lg shadow-sm">
            <div class="h-[500px] overflow-y-auto p-4 space-y-4">
                <div v-for="(msg, index) in messages" :key="index"
                    :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
                    <div :class="[
                        'max-w-xs rounded-lg p-3',
                        msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'
                    ]">
                        {{ msg.content }}
                    </div>
                </div>
            </div>
            <div v-if="showChart" class="p-4">
                <StockChart :historicalData="historicalData" :predictedData="predictedData" :symbol="currentSymbol" />
            </div>
            <div class="border-t rounded-b-lg bg-white p-4">
                <div class="flex space-x-2">
                    <input v-model="userInput" @keyup.enter="sendMessage"
                        class="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                        placeholder="Type your message...">
                    <button @click="sendMessage"
                        class="bg-gray-800 text-white rounded-full px-4 py-2 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-800">
                        Send
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import StockChart from './components/StockChart.vue'

const messages = ref([])
const userInput = ref('')
const showChart = ref(false)
const historicalData = ref([])
const predictedData = ref([])
const currentSymbol = ref('')

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

        if (response.needsPrediction && response.stockSymbol) {
            messages.value.push({ role: 'assistant', content: `Fetching stock data for ${response.stockSymbol}...` })

            try {
                const predictionResponse = await $fetch('/api/predict', {
                    method: 'GET',
                    params: { symbol: response.stockSymbol }
                })

                historicalData.value = predictionResponse.prices
                predictedData.value = predictionResponse.prediction.values
                currentSymbol.value = predictionResponse.symbol
                showChart.value = true

                messages.value.push({ role: 'assistant', content: `I've created a chart showing the historical data and prediction for ${predictionResponse.symbol}. You can see it below.` })

                const tendencyMessage = `Predicted tendency: ${predictionResponse.prediction.tendency[0] === 1 ? 'Upward' : 'Downward'}`
                messages.value.push({ role: 'assistant', content: tendencyMessage })
            } catch (error) {
                messages.value.push({ role: 'assistant', content: `Error fetching stock data: ${error.message}` })
            }
        }
    } catch (error) {
        console.error('Error sending message:', error)
        messages.value.push({ role: 'assistant', content: 'Sorry, there was an error processing your request.' })
    }
}

const scrollToBottom = () => {
    const chatContainer = document.querySelector('.overflow-y-auto')
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
    }
}

watch(messages, () => {
    nextTick(() => {
        scrollToBottom()
    })
}, { deep: true })

onMounted(() => {
    scrollToBottom()
})
</script>