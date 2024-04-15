// 语音合成服务的配置选项
const ttsConfig = {
  edgeTTSURL:
    "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4",
  voiceMIME: "audio/mpeg",
  lang: "zh-CN",
};

const voiceData = []; // 语音流
const supportMSE = !!window.MediaSource; // 是否支持MSE（除了ios应该都支持）
let speechPushing = false;
const speechQuene = [];
let voiceSocket; // 语音流socket，由于 WebSocket 实例不需要响应式，所以这里不用 ref
let sourceBuffer; // SourceBuffer 实例不需要响应式

// 实例初始化
const initSocket = () => {
  return new Promise((res, rej) => {
    if (!voiceSocket || voiceSocket.readyState > 1) {
      voiceSocket = new WebSocket(ttsConfig.edgeTTSURL);
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
const generateUUID = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
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
  if (!speechPushing && !sourceBuffer.updating) {
    speechPushing = true;
    sourceBuffer.appendBuffer(buffer);
  } else {
    speechQuene.push(buffer);
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
        voiceData[key] = new Blob(bufArray, {
          type: ttsConfig.voiceMIME,
        });
        res(voiceData[key]);
      }
    };
  });
};

const endSpeak = () => {
  // 判断是否存在实例，不存在则创建
  if (!window.voiceIns) {
    window.voiceIns = new Audio();
  }
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
  speechQuene.length = 0;
};

// // 发送TTS请求的改进版本
// const sendTTSRequest = async (
//   socket,
//   { lang, voiceName, volume, rate, pitch, text }
// ) => {
//   const waitForOpenConnection = (socket) => {
//     return new Promise((resolve, reject) => {
//       const maxNumberOfAttempts = 10;
//       const intervalTime = 200; // 每200ms检查一次

//       let currentAttempt = 0;
//       const interval = setInterval(() => {
//         if (currentAttempt > maxNumberOfAttempts - 1) {
//           clearInterval(interval);
//           reject(new Error("Maximum number of attempts exceeded"));
//         } else if (socket.readyState === socket.OPEN) {
//           clearInterval(interval);
//           resolve();
//         }
//         currentAttempt++;
//       }, intervalTime);
//     });
//   };

//   await waitForOpenConnection(socket); // 等待连接开启

//   const requestId = generateUUID();
//   const timestamp = new Date().toISOString();
//   const volumePercentage = volume === 1 ? "+0%" : `${volume * 100 - 100}%`;
//   const ratePercentage = (rate >= 1 ? "+" : "") + `${rate * 100 - 100}%`;
//   const pitchValue = (pitch >= 1 ? "+" : "") + `${pitch - 1}Hz`;

//   // 发送语音配置信息
//   const audioConfig = `X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
//   socket.send(audioConfig);

//   // 发送文本内容
//   const textContent = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${timestamp}Z\r\nPath:ssml\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='${lang}'><voice name='${voiceName}'><prosody pitch='${pitchValue}' rate='${ratePercentage}' volume='${volumePercentage}'>${text}</prosody></voice></speak>`;
//   socket.send(textContent);
// };

const playSpeech = async ({ text, voiceName, volume, rate, pitch }) => {
  //初始化播放设置和变量
  endSpeak();
  sourceBuffer = void 0;
  const currDate = new Date().toISOString();
  const uuid = generateUUID();
  const key = text + voiceName + volume + rate + pitch;
  // 赋值语音流给当前数据
  console.log(voiceData)
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
        sourceBuffer = mediaSource.addSourceBuffer(ttsConfig.voiceMIME);
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
          pushToSpeechQueue(buf);
        } else if (e.data.indexOf("Path:turn.end") !== -1) {
          voiceSocket["pending"] = false;
          voiceData[key] = new Blob(bufArray, {
            type: ttsConfig.voiceMIME,
          });
          if (!speechQuene.length && !speechPushing) {
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
        ttsConfig.lang,
        voiceName,
        volume,
        rate,
        pitch,
        text
      )
    );
    // sendTTSRequest(voiceSocket, {
    //   lang: ttsConfig.lang,
    //   voiceName: voiceName,
    //   volume: volume,
    //   rate: rate,
    //   pitch: pitch,
    //   text: text,
    // });
    voiceSocket["pending"] = true;
    if (!supportMSE) {
      let blob = await NoMSEPending(key);
      window.voiceIns.src = URL.createObjectURL(blob);
      window.voiceIns.onloadeddata = () => {
        window.voiceIns.play().catch((e) => console.error("播放失败:", e));
      };
    }
  }
};

export { playSpeech };
