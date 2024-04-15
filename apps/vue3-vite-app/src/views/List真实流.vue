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
      <button @click="fetchStreamData">开始接收数据</button>
      <button @click="stopSimulation">停止模拟</button>
    </div>
    <p>{{ textToSpeak }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const textToSpeak = ref('');
const voices = ref([]);
const selectedVoice = ref('');
let simulationInterval = null;

const loadVoices = () => {
  voices.value = speechSynthesis.getVoices()
};

onMounted(() => {
  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
});

const fetchStreamData = () => {
  stopSimulation(); // 先停止之前的模拟
  textToSpeak.value = '';

  const sessionId = Math.random().toString(36).substring(2, 15);
  const url = 'http://172.16.2.31:8099/digital-person/sse/ask?question=人才引进如何办理';
  const headers = new Headers();
  headers.append('Session-Id', sessionId);

  fetch(url, { method: 'GET', headers: headers })
    .then(response => {
      if (response.ok) {
        const reader = response.body.getReader();
        console.log
        readStream(reader);
      } else {
        throw new Error('Network response was not ok.');
      }
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
};

let accumulatedText = ''; // 用于累积接收到的字符

function readStream(reader) {
  reader.read().then(({ done, value }) => {
    if (!done) {
      // 将读取到的值解码
      const textChunk = new TextDecoder().decode(value, {stream: true});
      console.log('textChunk',textChunk)
      accumulatedText += textChunk;
      console.log('textChunk',accumulatedText)

      // 尝试找到句子的结束（基于标点符号）
      let sentenceEnd = findSentenceEnd(accumulatedText);

      while (sentenceEnd >= 0) {
        // 提取句子并处理
        const sentence = accumulatedText.substring(0, sentenceEnd + 1).trim();
        if (sentence) {
          textToSpeak.value += sentence + ' ';
          speak(sentence);
        }

        // 移除已处理的句子
        accumulatedText = accumulatedText.substring(sentenceEnd + 1);

        // 查找下一个句子的结束
        sentenceEnd = findSentenceEnd(accumulatedText);
      }

      // 继续读取下一块数据
      readStream(reader);
    } else if (accumulatedText.trim().length > 0) {
      // 处理流结束时累积的最后一部分文本
      textToSpeak.value += accumulatedText + ' ';
      speak(accumulatedText.trim());
      accumulatedText = ''; // 重置累积文本
    }
  });
}

// 查找句子结束的位置
function findSentenceEnd(text) {
  // 正则表达式匹配中文和英文的标点符号
  const regex = /[\.\?\!，。、；：？！]/g;
  const match = regex.exec(text);
  return match ? match.index : -1;
}



const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  speechSynthesis.cancel();
};

const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voices.value.find(voice => voice.name === selectedVoice.value);
  speechSynthesis.speak(utterance);
};
</script>
