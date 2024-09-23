<template>
    <div>
        <div
            class="fixed md:relative inset-0 md:w-[500px] md:h-[800px] bg-white rounded-lg shadow-md flex flex-col text-base md:text-sm border border-gray-200">
            <!-- Chat Header -->
            <div class="flex items-center justify-between p-4 border-b bg-gray-900 text-white rounded-t-lg">
                <h2 class="text-lg font-bold">Chat IA <span class="text-[#f4d659] ml-1 text-base font-extralight"
                        style="letter-spacing: 0.2em;">Sibyllium</span>
                </h2>
                <button @click="$emit('close')" class="text-white hover:text-gray-400 flex items-center">
                    <Icon name="heroicons:x-mark" class="w-6 h-6" />
                </button>
            </div>
            <div class="flex-grow overflow-y-auto p-4 space-y-4" ref="messagesContainer">
                <div v-for="(msg, index) in messages" :key="index"
                    :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
                    <div :class="[
                        'max-w-xs p-3',
                        msg.role === 'user' ? 'bg-gray-800 text-white rounded-t-lg rounded-bl-lg' : 'bg-gray-100 text-gray-800 rounded-t-lg rounded-br-lg',
                        msg.blinking ? 'blinking' : ''
                    ]">
                        <span v-html="formatMessage(msg.content)"></span>
                        <div v-if="msg.timestamp" class="text-gray-500 text-xs mt-1 text-right">{{ new
                            Date(msg.timestamp).toLocaleString(undefined, {
                                year: 'numeric', month: 'numeric', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            }) }}</div>
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
import { ref, watch, nextTick, onMounted } from 'vue';
import PredictionChart from '@/components/PredictionChart.vue';

const messages = ref([]);
const userInput = ref('');
const showChart = ref(false);
const historicalData = ref([]);
const predictedData = ref([]);
const currentSymbol = ref('');
const chartType = ref('');
const baseCurrency = ref('');
const targetCurrency = ref('');
const isChatOpen = ref(false);

const formatMessage = (content) => {
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
};

const sendMessage = async () => {
    if (!userInput.value.trim()) return;

    const message = userInput.value;
    const timestamp = new Date().toISOString(); // Format: YYYY-MM-DDTHH:mm:ss.sssZ

    userInput.value = ''; // Clear the input immediately after getting the message

    messages.value.push({ role: 'user', content: message, timestamp: timestamp });

    try {
        // Show blinking message while waiting for AI response
        const loadingMessage = { role: 'assistant', content: '...', blinking: true, timestamp: null };
        messages.value.push(loadingMessage);
        const loadingIndex = messages.value.length - 1;

        const response = await $fetch('/api/chat', {
            method: 'POST',
            body: { message: message, history: messages.value }
        });

        // Remove the loading message
        messages.value.pop();

        if (response.reply.trim()) {
            messages.value.push({ role: 'assistant', content: response.reply, timestamp: timestamp });
        }

        if (response.needsPrediction) {
            if (response.stockSymbol) {
                const loadingMessage = { role: 'assistant', content: `Prédiction de la tendance de ${response.stockSymbol}...`, blinking: true, timestamp: null };
                messages.value.push(loadingMessage);
                const predictionLoadingIndex = messages.value.length - 1;

                await new Promise(resolve => setTimeout(resolve, 1000)); // Adding a delay of 2 seconds

                try {
                    const predictionResponse = await $fetch('/api/predict', {
                        method: 'GET',
                        params: { symbol: response.stockSymbol }
                    });

                    // Remove the loading message
                    messages.value.splice(predictionLoadingIndex, 1);

                    historicalData.value = predictionResponse.prices;
                    predictedData.value = predictionResponse.prediction.values;
                    currentSymbol.value = predictionResponse.symbol;
                    chartType.value = 'stock';
                    showChart.value = true;

                    messages.value.push({ role: 'assistant', content: `J'ai créé un graphique montrant les données historiques et la prédiction pour ${predictionResponse.symbol}. Vous pouvez le voir ci-dessous.`, timestamp: timestamp });

                    const tendencyMessage = `Tendance prédite: **${predictionResponse.prediction.tendency[0] === 1 ? 'À la hausse' : 'À la baisse'}**`;
                    messages.value.push({ role: 'assistant', content: tendencyMessage, timestamp: timestamp });
                } catch (error) {
                    // Remove the loading message
                    messages.value.splice(predictionLoadingIndex, 1);
                    messages.value.push({ role: 'assistant', content: `Erreur lors de la récupération des données boursières: ${error.message}`, timestamp: new Date().toLocaleString() });
                }
            } else if (response.baseCurrency && response.targetCurrency) {
                const loadingMessage = { role: 'assistant', content: `Prédiction de la tendance de ${response.baseCurrency}/${response.targetCurrency}...`, blinking: true, timestamp: null };
                messages.value.push(loadingMessage);
                const currencyLoadingIndex = messages.value.length - 1;

                await new Promise(resolve => setTimeout(resolve, 1000)); // Adding a delay of 2 seconds

                try {
                    const predictionResponse = await $fetch('/api/predictCurrency', {
                        method: 'GET',
                        params: { baseCurrency: response.baseCurrency, targetCurrency: response.targetCurrency }
                    });

                    // Remove the loading message
                    messages.value.splice(currencyLoadingIndex, 1);

                    historicalData.value = predictionResponse.rates;
                    predictedData.value = predictionResponse.prediction.values;
                    baseCurrency.value = predictionResponse.baseCurrency;
                    targetCurrency.value = predictionResponse.targetCurrency;
                    chartType.value = 'currency';
                    showChart.value = true;

                    messages.value.push({ role: 'assistant', content: `J'ai créé un graphique montrant les données historiques et la prédiction pour ${predictionResponse.baseCurrency}/${predictionResponse.targetCurrency}. Vous pouvez le voir ci-dessous.`, timestamp: new Date().toLocaleString() });

                    const tendencyMessage = `Tendance prédite: **${predictionResponse.prediction.tendency[0] === 1 ? 'À la hausse' : 'À la baisse'}**`;
                    messages.value.push({ role: 'assistant', content: tendencyMessage, timestamp: timestamp });
                } catch (error) {
                    // Remove the loading message
                    messages.value.splice(currencyLoadingIndex, 1);
                    messages.value.push({ role: 'assistant', content: `Erreur lors de la récupération des données de change: ${error.message}`, timestamp: timestamp });
                }
            }
        }
    } catch (error) {
        console.error('Error sending message:', error);
        messages.value.push({ role: 'assistant', content: 'Sorry, there was an error processing your request.', timestamp: timestamp });
    }
};

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

const messagesContainer = ref(null);

const saveMessagesToLocalStorage = () => {
    localStorage.setItem('chatMessages', JSON.stringify(messages.value));
};

watch(messages, saveMessagesToLocalStorage, { deep: true });

watch(showChart, () => {
    nextTick(() => {
        scrollToBottom();
    });
});

onMounted(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
        messages.value = JSON.parse(savedMessages);
    }
    scrollToBottom();
});

watch(messages, () => {
    nextTick(() => {
        scrollToBottom();
    });
}, { deep: true });

</script>

<style scoped>
.blinking {
    animation: blinking 2s infinite;
}

@keyframes blinking {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0.2;
    }

    100% {
        opacity: 1;
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
        transform: translateY(0px);
    }

    to {
        opacity: 0;
        transform: translateY(5px);
    }
}

.animate-fade-out {
    animation: fadeOut 0.5s ease-out;
}
</style>