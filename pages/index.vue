<template>
    <div class="min-h-screen flex flex-col bg-gray-100 relative">
        <div class="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center">
            <img src="/logo.svg" alt="Sibyllium" class="w-7 mr-4">
            <span class="text-lg font-extralight"
                style="font-family: 'Questrial', sans-serif; letter-spacing: 0.3em; font-weight: 100;">Sibyllium</span>
        </div>
        <div class="flex-grow flex flex-col items-center justify-center">
            <h1 class="text-5xl font-bold mb-4 text-center">Predict Financial Markets with AI</h1>
            <p class="text-base text-gray-500 font-light mb-8 text-center max-w-lg">Leverage advanced AI technology to
                forecast stock prices and currency exchange rates with unparalleled accuracy.</p>
            <!-- New Clear Local Storage Button -->
            <button @click="clearLocalStorage"
                class="bg-[rgb(244,214,89)] text-gray-900 text-xs rounded-full py-4 px-4 mb-8 hover:bg-yellow-500 focus:outline-none flex items-center justify-center">
                {{ buttonText }}
                <Icon name="heroicons:trash-solid" class="w-4 h-4 ml-2" />
            </button>
            <button v-if="!isChatOpen" @click="toggleChat"
                class="fixed sm:bottom-8 sm:right-8 bottom-4 right-4 bg-[rgb(244,214,89,1)]  text-gray-900 rounded-full p-5 hover:bg-yellow-500 focus:outline-none flex items-center justify-center">
                <Icon name="heroicons:chat-bubble-oval-left-solid" class="w-8 h-8" />
            </button>
            <transition name="fade">
                <div v-if="isChatOpen" class="fixed bottom-8 right-8">
                    <Chat @close="toggleChat" />
                </div>
            </transition>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import Chat from '@/components/Chat.vue';

useHead({
    title: 'Sibyllium',
});

const messages = ref([]);
const buttonText = ref('Clear History (For testing purposes)');
const isChatOpen = ref(false);

const toggleChat = () => {
    isChatOpen.value = !isChatOpen.value;
    if (isChatOpen.value) {
        // Load messages from local storage when chat is opened
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            messages.value = JSON.parse(savedMessages);
        }
        // Scroll to bottom when chat is opened
        nextTick(() => {
            scrollToBottom();
        });
    }
};

// New function to clear local storage and show success message
const clearLocalStorage = () => {
    localStorage.clear();
    messages.value = [];
    buttonText.value = 'Success!';
    location.reload();
    setTimeout(() => {
        buttonText.value = 'Clear History (For testing purposes)';
    }, 1500); // Reset message after 3 seconds
};
</script>

<style scoped>
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
        transform: translateY(0);
    }

    to {
        opacity: 0;
        transform: translateY(5px);
    }
}

.animate-fade-in {
    animation: fadeIn 0.5s ease-out;
}

.animate-fade-out {
    animation: fadeOut 0.5s ease-out;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s, transform 0.5s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(5px);
}
</style>