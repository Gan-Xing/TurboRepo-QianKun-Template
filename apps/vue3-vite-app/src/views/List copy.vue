<template>
  <div id="app">
    <h1>Vue 3 + TTS Demo</h1>
    <div>
      <label for="voice">选择语音:</label>
      <select id="voice" v-model="selectedVoice">
        <option v-for="voice in voices" :key="voice.name" :value="voice.name">
          {{ voice.friendlyName }}
        </option>
      </select>
    </div>
    <div>
      <label for="volume">音量:</label>
      <input
        type="range"
        id="rate"
        min="0"
        max="2"
        step="0.1"
        v-model="volume"
      />
      {{ volume }}
    </div>
    <div>
      <label for="rate">速率:</label>
      <input
        type="range"
        id="rate"
        min="0.5"
        max="2"
        step="0.1"
        v-model="rate"
      />
      {{ rate }}
    </div>
    <div>
      <label for="pitch">音调:</label>
      <input
        type="range"
        id="pitch"
        min="0"
        max="2"
        step="0.1"
        v-model="pitch"
      />
      {{ pitch }}
    </div>
    <div>
      <label for="textContent">文本内容:</label>
      <textarea id="textContent" v-model="content" rows="4"></textarea>
    </div>
    <button @click="speak">Speak</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
const content = ref(
  "毕业两年内本科学历、已在本市落实就业单位的大专及以上学历均可申请办理，实际办理请根据本人情况选择人才类型。"
);
const edgeTTSURL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const voiceMIME = "audio/mpeg";
const lang = "zh-CN";
const voices = ref([]);
const selectedVoice = ref("");
const volume = ref(1)
const rate = ref(1);
const pitch = ref(1);
const voiceData = ref([]); // 语音流
const supportMSE = ref(!!window.MediaSource); // 是否支持MSE（除了ios应该都支持）
const speechPushing = ref(false);
const speechQuene = ref([]);
let voiceSocket; // 语音流socket，由于 WebSocket 实例不需要响应式，所以这里不用 ref
let sourceBuffer; // SourceBuffer 实例不需要响应式

// 请求语音列表
const fetchVoices = async () => {
  try {
    //判断是否存在实例，不存在则创建
    if (!window.voiceIns) {
      window.voiceIns = new Audio();
    }
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

// 实例初始化
const initSocket = () => {
  return new Promise((res, rej) => {
    if (!voiceSocket || voiceSocket.readyState > 1) {
      voiceSocket = new WebSocket(edgeTTSURL);
      voiceSocket.binaryType = "arraybuffer";
      voiceSocket.onopen = () => {
        res();
      };
      voiceSocket.onerror = () => {
        rej();
      };
    } else {
      return res();
    }
  });
};
const initStreamVoice = (mediaSource) => {
  return new Promise((r, j) => {
    Promise.all([
      initSocket(),
      new Promise((res) => {
        mediaSource.onsourceopen = () => {
          res();
        };
      }),
    ]).then(() => {
      r();
    });
  });
};

// 工具函数
const uuidv4 = () => {
  let uuid = ([1e7] + 1e3 + 4e3 + 8e3 + 1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
  return uuid;
};
const getTime = () => {
  return new Date().toString();
};
const getWSAudio = (date) => {
  return `X-Timestamp:${date}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
};
const getWSText = (date, requestId, lang, voice, volume, rate, pitch, msg) => {
  let fmtVolume = volume === 1 ? "+0%" : volume * 100 - 100 + "%";
  let fmtRate = (rate >= 1 ? "+" : "") + (rate * 100 - 100) + "%";
  let fmtPitch = (pitch >= 1 ? "+" : "") + (pitch - 1) + "Hz";
  return `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${date}Z\r\nPath:ssml\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='${lang}'><voice name='${voice}'><prosody pitch='${fmtPitch}' rate='${fmtRate}' volume='${fmtVolume}'>${msg}</prosody></voice></speak>`;
};

// 核心逻辑
const pushToSpeechQueue = (buffer) => {
  if (!speechPushing.value && !sourceBuffer.updating) {
    speechPushing.value = true;
    sourceBuffer.appendBuffer(buffer);
  } else {
    speechQuene.value.push(buffer);
  }
};
const NoMSEPending = (key) => {
  return new Promise((res, rej) => {
    let bufArray = [];
    voiceSocket.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        bufArray.push(e.data.slice(130));
      } else if (e.data.indexOf("Path:turn.end") !== -1) {
        voiceSocket["pending"] = false;
        voiceData.value[key] = new Blob(bufArray, { type: voiceMIME });
        res(voiceData.value[key]);
      }
    };
  });
};
const endSpeak = () => {
  // 初始化播放设置与变量
  if (window.voiceIns) {
    window.voiceIns.pause();
    window.voiceIns.currentTime = 0;
    URL.revokeObjectURL(window.voiceIns.src);
    window.voiceIns.removeAttribute("src");
    window.voiceIns.onended = window.voiceIns.onerror = null;
  }
  sourceBuffer = void 0;
  speechPushing.value = false;
  if (voiceSocket && voiceSocket["pending"]) {
    voiceSocket.close();
  }
  speechQuene.value.length = 0;
};

const speak = async () => {
  //初始化播放设置和变量
  endSpeak();
  sourceBuffer = void 0;
  let currDate = getTime();
  
  let uuid = uuidv4();
  let key =
    content.value + selectedVoice.value + volume.value + rate.value + pitch.value;
  // 赋值语音流给当前数据
  let currData = voiceData.value[key];
  //存在语音流则直接播放
  if (currData) {
    window.voiceIns.src = URL.createObjectURL(currData);
    window.voiceIns.onloadeddata = () => {
      window.voiceIns.play().catch((e) => console.error("播放失败:", e));
    };
  } else {
    //不存在则进一步处理
    let mediaSource;
    if (supportMSE.value) {
      mediaSource = new MediaSource();
      window.voiceIns.src = URL.createObjectURL(mediaSource);
      window.voiceIns.onloadeddata = () => {
        window.voiceIns.play().catch((e) => console.error("播放失败:", e));
      };
      await initStreamVoice(mediaSource);
      if (!sourceBuffer) {
        sourceBuffer = mediaSource.addSourceBuffer(voiceMIME);
      }
      sourceBuffer.onupdateend = function () {
        speechPushing.value = false;
        if (speechQuene.value.length) {
          let buf = speechQuene.value.shift();
          if (buf["end"]) {
            mediaSource.endOfStream();
          } else {
            speechPushing.value = true;
            sourceBuffer.appendBuffer(buf);
          }
        }
      };
      let bufArray = [];
      voiceSocket.onmessage = (e) => {
        if (e.data instanceof ArrayBuffer) {
          let buf = e.data.slice(130);
          bufArray.push(buf);
          pushToSpeechQueue(buf);
        } else if (e.data.indexOf("Path:turn.end") !== -1) {
          voiceSocket["pending"] = false;
          voiceData.value[key] = new Blob(bufArray, { type: voiceMIME });
          if (!speechQuene.value.length && !speechPushing.value) {
            mediaSource.endOfStream();
          } else {
            let buf = new ArrayBuffer();
            buf["end"] = true;
            pushToSpeechQueue(buf);
          }
        }
      };
    } else {
      await initSocket();
    }
    voiceSocket.send(getWSAudio(currDate));
    voiceSocket.send(
      getWSText(
        currDate,
        uuid,
        lang,
        selectedVoice.value,
        volume.value,
        rate.value,
        pitch.value,
        content.value
      )
    );
    voiceSocket["pending"] = true;
    if (!supportMSE.value) {
      let blob = await NoMSEPending(key);
      window.voiceIns.src = URL.createObjectURL(blob);
      window.voiceIns.onloadeddata = () => {
        window.voiceIns.play().catch((e) => console.error("播放失败:", e));
      };
    }
  }
};

// 生命周期
onMounted(fetchVoices);
</script>
