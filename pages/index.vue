<template>
    <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 class="text-5xl font-bold mb-4 text-center">Welcome to Our Application</h1>
        <p class="text-lg text-gray-700 mb-8 text-center">This is a basic one-page layout that fits the screen with
            other
            information.</p>
        <!-- New Clear Local Storage Button -->
        <button @click="clearLocalStorage"
            class="bg-purple-500 text-white text-xs rounded-full py-4 px-4 mb-8 hover:bg-purple-700 focus:outline-none flex items-center justify-center">
            {{ buttonText }}
            <Icon name="heroicons:trash-solid" class="w-4 h-4 ml-2" />
        </button>
        <button v-if="!isChatOpen" @click="toggleChat"
            class="fixed sm:bottom-8 sm:right-8 bottom-4 right-4 bg-gray-800 text-white rounded-full p-5 hover:bg-gray-600 focus:outline-none flex items-center justify-center">
            <Icon name="heroicons:chat-bubble-oval-left-solid" class="w-8 h-8" />
        </button>
        <transition name="fade">
            <div v-if="isChatOpen" class="fixed bottom-8 right-8">
                <Chat @close="toggleChat" />
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import Chat from '@/components/Chat.vue';

useHead({
    title: 'AI Predictor',
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