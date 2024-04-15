<template>
  <div id="app">
    <h1>Vue 3 + TTS Demo</h1>
    <div>
      <label for="voiceSelect">选择语音:</label>
      <select id="voiceSelect" v-model="selectedVoice">
        <option v-for="voice in voices" :key="voice.name" :value="voice.name">
          {{ voice.friendlyName }}
        </option>
      </select>
    </div>
    <div>
      <label for="volumeControl">音量:</label>
      <input type="range" id="volumeControl" min="0" max="2" step="0.1" v-model="volume" />
      {{ volume }}
    </div>
    <div>
      <label for="rateControl">速率:</label>
      <input type="range" id="rateControl" min="0.5" max="2" step="0.1" v-model="rate" />
      {{ rate }}
    </div>
    <div>
      <label for="pitchControl">音调:</label>
      <input type="range" id="pitchControl" min="0" max="2" step="0.1" v-model="pitch" />
      {{ pitch }}
    </div>
    <div>
      <label for="textContent">文本内容:</label>
      <textarea id="textContent" v-model="content" rows="4"></textarea>
    </div>
    <button @click="handleSpeak">播放</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { playSpeech } from './TTSService.js';

const content = ref("这里是一段示例文本，你可以修改它来测试不同的语音播报效果。");
const voices = ref([]);
const selectedVoice = ref('');
const volume = ref(1);
const rate = ref(1);
const pitch = ref(1);

// 请求语音列表
const fetchVoices = async () => {
  try {
    const response = await fetch(
      "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4"
    );
    if (!response.ok) throw new Error("Failed to fetch voices");
    const data = await response.json();
    // 筛选仅包含中文和英文的选项，并将中文选项排在前面
    voices.value = data
      .filter(
        (voice) => voice.Locale.startsWith("zh-")
        // voice.Locale.startsWith("zh-") || voice.Locale.startsWith("en-")
      )
      .sort((a, b) => a.Locale.localeCompare(b.Locale))
      .map((voice) => ({
        name: voice.Name,
        friendlyName: voice.FriendlyName,
        lang: voice.Locale,
      }));
    if (voices.value.length > 0) {
      selectedVoice.value = voices.value[0].name; // 设置默认选中的语音
    }
  } catch (error) {
    console.error("Error fetching voices:", error);
  }
};
// 示例：假设这是从API获取的语音列表
onMounted(fetchVoices);

const handleSpeak = () => {
  playSpeech({
    lang: "zh-CN", // 这里可以动态设置语言
    voiceName: selectedVoice.value,
    volume: volume.value,
    rate: rate.value,
    pitch: pitch.value,
    text: content.value,
  })
};
</script>
