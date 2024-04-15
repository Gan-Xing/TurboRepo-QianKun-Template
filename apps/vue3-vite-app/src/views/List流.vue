<template>
  <div id="app">
    <h1>Vue 3 + TTS 流式输入演示</h1>
    <div>
      <label for="voice">选择语音:</label>
      <select id="voice" v-model="selectedVoice">
        <option v-for="voice in voices" :key="voice.name" :value="voice.name">{{ voice.name }}</option>
      </select>
    </div>
    <div>
      <button @click="startSimulation">开始模拟输入</button>
      <button @click="stopSimulation">停止模拟</button>
    </div>
    <p>{{ textToSpeak }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const textToSpeak = ref('');
const sentences = [
  '毕业两年内本科学历',
  '已在本市落实就业单位的大专及以上学历均可申请办理',
  '实际办理请根据本人情况选择人才类型。'
];


let currentIndex = 0;
let simulationInterval = null;

const voices = ref([]);
const selectedVoice = ref('');

const loadVoices = () => {
  voices.value = speechSynthesis.getVoices()
};

onMounted(() => {
  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
});

const startSimulation = () => {
  stopSimulation(); // 先停止之前的模拟
  currentIndex = 0;
  textToSpeak.value = '';
  simulationInterval = setInterval(() => {
    if (currentIndex < sentences.length) {
      textToSpeak.value += sentences[currentIndex] + ' ';
      speak(sentences[currentIndex]);
      currentIndex++;
    } else {
      stopSimulation();
    }
  }, 100);
};

const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
};

const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voices.value.find(voice => voice.name === selectedVoice.value);
  speechSynthesis.speak(utterance);
};
</script>
