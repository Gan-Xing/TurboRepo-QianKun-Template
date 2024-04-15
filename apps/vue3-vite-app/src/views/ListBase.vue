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
    <button @click="speak">Speak</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const content = ref(
  "毕业两年内本科学历、已在本市落实就业单位的大专及以上学历均可申请办理，实际办理请根据本人情况选择人才类型。"
);
const voices = ref([]);
const selectedVoice = ref("");
const rate = ref(1);
const pitch = ref(1);
const uuidv4 = () => {
  let uuid = ([1e7] + 1e3 + 4e3 + 8e3 + 1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
  return existVoice === 3 ? uuid.toUpperCase() : uuid;
};

// 修改加载语音的函数
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
        (voice) =>
          voice.Locale.startsWith("zh-") || voice.Locale.startsWith("en-")
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
const NoMSEPending = (key) => {
  return new Promise((res, rej) => {
    let bufArray = [];
    voiceSocket.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        bufArray.push(e.data.slice(130));
      } else if (e.data.indexOf("Path:turn.end") !== -1) {
        voiceSocket["pending"] = false;
        voiceData[key] = new Blob(bufArray, { type: voiceMIME });
        res(voiceData[key]);
      }
    };
  });
};
onMounted(fetchVoices);
// let voiceIns; // Audio or SpeechSynthesisUtterance
let voiceData = []; //语音流
let supportMSE = !!window.MediaSource; // 是否支持MSE（除了ios应该都支持）
let voiceSocket; // 语音流socket
let voiceMIME = "audio/mpeg";
let speechPushing = false;
let speechQuene = [];
let sourceBuffer;
let existVoice = 2;
let currentVoiceIdx;
let autoVoiceSocket;
let autoMediaSource;
let voiceContentQuene = [];
let voiceEndFlagQuene = [];
let voiceBlobURLQuene = [];
let autoOnlineVoiceFlag = false;

speechQuene.push = function (buffer) {
  if (!speechPushing && !sourceBuffer.updating) {
    speechPushing = true;
    sourceBuffer.appendBuffer(buffer);
  } else {
    Array.prototype.push.call(this, buffer);
  }
};
const edgeTTSURL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4";

const resetSpeakIcon = () => {
  if (currentVoiceIdx !== void 0) {
    console.log("重置播放图标状态");
    // chatlog.children[
    //   systemRole ? currentVoiceIdx - 1 : currentVoiceIdx
    // ].children[1].lastChild.className = "readyVoice";
  }
};
const endSpeak = () => {
  // 初始化播放设置与变量
  resetSpeakIcon();
  if (existVoice >= 2) {
    if (window.voiceIns) {
      window.voiceIns.pause();
      window.voiceIns.currentTime = 0;
      URL.revokeObjectURL(window.voiceIns.src);
      window.voiceIns.removeAttribute("src");
      window.voiceIns.onended = window.voiceIns.onerror = null;
    }
    sourceBuffer = void 0;
    speechPushing = false;
    if (voiceSocket && voiceSocket["pending"]) {
      voiceSocket.close();
    }
    if (autoVoiceSocket && autoVoiceSocket["pending"]) {
      autoVoiceSocket.close();
    }
    speechQuene.length = 0;
    autoMediaSource = void 0;
    voiceContentQuene = [];
    voiceEndFlagQuene = [];
    voiceBlobURLQuene = [];
    autoOnlineVoiceFlag = false;
  } else {
    speechSynthesis.cancel();
  }
  currentVoiceIdx = void 0;
};
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
const getTime = () => {
  return existVoice === 3 ? new Date().toISOString() : new Date().toString();
};
const getWSAudio = (date, requestId) => {
  return existVoice === 3
    ? `Path: synthesis.context\r\nX-RequestId: ${requestId}\r\nX-Timestamp: ${date}\r\nContent-Type: application/json\r\n\r\n{"synthesis":{"audio":{"metadataOptions":{"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":false},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}`
    : `X-Timestamp:${date}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
};
const getWSText = (
  date,
  requestId,
  lang,
  voice,
  volume,
  rate,
  pitch,
  style,
  role,
  msg
) => {
  let fmtVolume = volume === 1 ? "+0%" : volume * 100 - 100 + "%";
  let fmtRate = (rate >= 1 ? "+" : "") + (rate * 100 - 100) + "%";
  let fmtPitch = (pitch >= 1 ? "+" : "") + (pitch - 1) + "Hz";
  if (existVoice === 3) {
    let fmtStyle = style ? ` style="${style}"` : "";
    let fmtRole = role ? ` role="${role}"` : "";
    let fmtExpress = fmtStyle + fmtRole;
    return `Path: ssml\r\nX-RequestId: ${requestId}\r\nX-Timestamp: ${date}\r\nContent-Type: application/ssml+xml\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='${lang}'><voice name='${voice}'><mstts:express-as${fmtExpress}><prosody pitch='${fmtPitch}' rate='${fmtRate}' volume='${fmtVolume}'>${msg}</prosody></mstts:express-as></voice></speak>`;
  } else {
    return `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${date}Z\r\nPath:ssml\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='${lang}'><voice name='${voice}'><prosody pitch='${fmtPitch}' rate='${fmtRate}' volume='${fmtVolume}'>${msg}</prosody></voice></speak>`;
  }
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
const speak = async (idx) => {
  //idx是对话序号，data是对话对象数组，如果对话不存在则返回
  // if (!data[idx]) return;

  //初始化播放设置和变量
  endSpeak();
  sourceBuffer = void 0;
  // currentVoiceIdx = idx;

  // 如果当前对话不存在内容，则播放下一段
  // if (!data[idx].content && enableContVoice) {
  //   if (currentVoiceIdx !== data.length - 1) {
  //     return speechEvent(currentVoiceIdx + 1);
  //   } else {
  //     return endSpeak();
  //   }
  // }

  // 判断播放的角色
  // let type = data[idx].role === "user" ? 0 : 1;

  // TODO没注意这段写的什么问题不大
  // chatlog.children[systemRole ? idx - 1 : idx].children[1].lastChild.className = "pauseVoice";

  // 获取文本内容与播放配置
  // 内容
  // let content = data[idx].content;
  // 音量
  // let volume = voiceVolume[type];
  // 速率
  // let rate = voiceRate[type];
  // 音调
  // let pitch = voicePitch[type];
  // let content = "你好";
  let volume = 1;
  // let rate = 1;
  // let pitch = 1;
  // // 没有Azure下面的不用管
  // let style = azureStyle[type];
  // let role = azureRole[type];
  let style;
  let role;

  // 语音合成的名字获取
  // let voice = existVoice === 3 ? voiceRole[type].ShortName : voiceRole[type].Name;
  let voice = selectedVoice.value;

  // 定义语音流的key
  let key =
    content.value +
    voice +
    volume +
    rate.value +
    pitch.value +
    (style ? style : "") +
    (role ? role : "");
  // 赋值语音流给当前数据
  let currData = voiceData[key];
  //存在语音流则直接播放
  if (currData) {
    window.voiceIns.src = URL.createObjectURL(currData);
    window.voiceIns.onloadeddata = () => {
      window.voiceIns.play().catch((e) => console.error("播放失败:", e));
    };
  } else {
    //不存在则进一步处理
    let mediaSource;
    if (supportMSE) {
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
        speechPushing = false;
        if (speechQuene.length) {
          let buf = speechQuene.shift();
          if (buf["end"]) {
            mediaSource.endOfStream();
          } else {
            speechPushing = true;
            sourceBuffer.appendBuffer(buf);
          }
        }
      };
      let bufArray = [];
      voiceSocket.onmessage = (e) => {
        if (e.data instanceof ArrayBuffer) {
          let buf = e.data.slice(130);
          bufArray.push(buf);
          speechQuene.push(buf);
        } else if (e.data.indexOf("Path:turn.end") !== -1) {
          voiceSocket["pending"] = false;
          voiceData[key] = new Blob(bufArray, { type: voiceMIME });
          if (!speechQuene.length && !speechPushing) {
            mediaSource.endOfStream();
          } else {
            let buf = new ArrayBuffer();
            buf["end"] = true;
            speechQuene.push(buf);
          }
        }
      };
    } else {
      await initSocket();
    }
    let currDate = getTime();
    // let lang = voiceRole[type].lang;
    let lang = "zh-CN";
    let uuid = uuidv4();
    // 无Azure配置，无需下一步
    // if (existVoice === 3) {
    //   voiceSocket.send(getWSPre(currDate, uuid));
    // }

    voiceSocket.send(getWSAudio(currDate, uuid));
    voiceSocket.send(
      getWSText(
        currDate,
        uuid,
        lang,
        voice,
        volume,
        rate.value,
        pitch.value,
        style,
        role,
        content.value
      )
    );
    voiceSocket["pending"] = true;
    if (!supportMSE) {
      let blob = await NoMSEPending(key);
      window.voiceIns.src = URL.createObjectURL(blob);
      window.voiceIns.onloadeddata = () => {
        window.voiceIns.play().catch((e) => console.error("播放失败:", e));
      };
    }
  }

  // const utterance = new SpeechSynthesisUtterance(textToSpeak.value);
  // const selected = voices.value.find(
  //   (voice) => voice.name === selectedVoice.value
  // );
  // utterance.voice = speechSynthesis
  //   .getVoices()
  //   .find((voice) => voice.name === selected.name);
  // utterance.rate = rate.value;
  // utterance.pitch = pitch.value;
  // speechSynthesis.speak(utterance);
};
</script>

<style>
/* 添加一些基本样式 */
</style>
