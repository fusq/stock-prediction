<template>
    <div>
        <button v-if="!isChatOpen" @click="toggleChat"
            class="fixed bottom-8 right-8 bg-gray-800 text-white rounded-full p-5 hover:bg-gray-600 focus:outline-none flex items-center justify-center">
            <Icon name="heroicons:chat-bubble-oval-left-solid" class="w-8 h-8" />
        </button>
        <div v-if="isChatOpen" class="bottom-8 right-8 fixed">
            <Chat @close="toggleChat" />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import Chat from '@/components/Chat.vue';

const isChatOpen = ref(false);

const toggleChat = () => {
    isChatOpen.value = !isChatOpen.value;
};
</script>