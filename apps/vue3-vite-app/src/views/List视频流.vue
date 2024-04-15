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
    <video id="videoElement" autoplay playsinline></video>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// 初始化SRS WebRTC播放器
let player = null;
function SrsError(name, message) {
  this.name = name;
  this.message = message;
  this.stack = new Error().stack;
}
SrsError.prototype = Object.create(Error.prototype);
SrsError.prototype.constructor = SrsError;

// Depends on adapter-7.4.0.min.js from https://github.com/webrtc/adapter
// Async-await-promise based SRS RTC Player.
function SrsRtcPlayerAsync() {
  var self = {};

  // @see https://github.com/rtcdn/rtcdn-draft
  // @url The WebRTC url to play with, for example:
  //      webrtc://r.ossrs.net/live/livestream
  // or specifies the API port:
  //      webrtc://r.ossrs.net:11985/live/livestream
  //      webrtc://r.ossrs.net:80/live/livestream
  // or autostart the play:
  //      webrtc://r.ossrs.net/live/livestream?autostart=true
  // or change the app from live to myapp:
  //      webrtc://r.ossrs.net:11985/myapp/livestream
  // or change the stream from livestream to mystream:
  //      webrtc://r.ossrs.net:11985/live/mystream
  // or set the api server to myapi.domain.com:
  //      webrtc://myapi.domain.com/live/livestream
  // or set the candidate(eip) of answer:
  //      webrtc://r.ossrs.net/live/livestream?candidate=39.107.238.185
  // or force to access https API:
  //      webrtc://r.ossrs.net/live/livestream?schema=https
  // or use plaintext, without SRTP:
  //      webrtc://r.ossrs.net/live/livestream?encrypt=false
  // or any other information, will pass-by in the query:
  //      webrtc://r.ossrs.net/live/livestream?vhost=xxx
  //      webrtc://r.ossrs.net/live/livestream?token=xxx
  self.play = async function (url) {
    var conf = self.__internal.prepareUrl(url);
    self.pc.addTransceiver("audio", { direction: "recvonly" });
    self.pc.addTransceiver("video", { direction: "recvonly" });
    //self.pc.addTransceiver("video", {direction: "recvonly"});
    //self.pc.addTransceiver("audio", {direction: "recvonly"});

    var offer = await self.pc.createOffer();
    await self.pc.setLocalDescription(offer);
    var session = await new Promise(function (resolve, reject) {
      // @see https://github.com/rtcdn/rtcdn-draft
      var data = {
        api: conf.apiUrl,
        tid: conf.tid,
        streamurl: conf.streamUrl,
        clientip: null,
        sdp: offer.sdp
      };
      console.log("Generated offer: ", data);

      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        if (xhr.readyState !== xhr.DONE) return;
        if (xhr.status !== 200 && xhr.status !== 201) return reject(xhr);
        const data = JSON.parse(xhr.responseText);
        console.log("Got answer: ", data);
        return data.code ? reject(xhr) : resolve(data);
      };
      xhr.open("POST", conf.apiUrl, true);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.send(JSON.stringify(data));
    });
    await self.pc.setRemoteDescription(
      new RTCSessionDescription({ type: "answer", sdp: session.sdp })
    );
    session.simulator =
      conf.schema +
      "//" +
      conf.urlObject.server +
      ":" +
      conf.port +
      "/rtc/v1/nack/";

    return session;
  };

  // Close the player.
  self.close = function () {
    self.pc && self.pc.close();
    self.pc = null;
  };

  // The callback when got remote track.
  // Note that the onaddstream is deprecated, @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/onaddstream
  self.ontrack = function (event) {
    // https://webrtc.org/getting-started/remote-streams
    self.stream.addTrack(event.track);
  };

  // Internal APIs.
  self.__internal = {
    defaultPath: "/rtc/v1/play/",
    prepareUrl: function (webrtcUrl) {
      var urlObject = self.__internal.parse(webrtcUrl);

      // If user specifies the schema, use it as API schema.
      var schema = urlObject.user_query.schema;
      schema = schema ? schema + ":" : window.location.protocol;

      var port = urlObject.port || 1985;
      if (schema === "https:") {
        port = urlObject.port || 443;
      }

      // @see https://github.com/rtcdn/rtcdn-draft
      var api = urlObject.user_query.play || self.__internal.defaultPath;
      if (api.lastIndexOf("/") !== api.length - 1) {
        api += "/";
      }

      if (urlObject.server == "live.yuxiang.ren") {
        schema = "https:";
        port = "443";
      }

      var apiUrl = schema + "//" + urlObject.server + ":" + port + api;
      for (var key in urlObject.user_query) {
        if (key !== "api" && key !== "play") {
          apiUrl += "&" + key + "=" + urlObject.user_query[key];
        }
      }
      // Replace /rtc/v1/play/&k=v to /rtc/v1/play/?k=v
      apiUrl = apiUrl.replace(api + "&", api + "?");

      var streamUrl = urlObject.url;

      return {
        // apiUrl : 'https://live.yuxiang.ren:443/rtc/v1/play/',
        // apiUrl: 'http://114.118.67.111:40029/rtc/v1/play/',
        apiUrl: apiUrl,
        streamUrl: streamUrl,
        schema: schema,
        urlObject: urlObject,
        port: port,
        tid: Number(parseInt(new Date().getTime() * Math.random() * 100))
          .toString(16)
          .slice(0, 7)
      };
    },
    parse: function (url) {
      // @see: http://stackoverflow.com/questions/10469575/how-to-use-location-object-to-parse-url-without-redirecting-the-page-in-javascri
      var a = document.createElement("a");
      a.href = url
        .replace("rtmp://", "http://")
        .replace("webrtc://", "http://")
        .replace("rtc://", "http://");

      var vhost = a.hostname;
      var app = a.pathname.substring(1, a.pathname.lastIndexOf("/"));
      var stream = a.pathname.slice(a.pathname.lastIndexOf("/") + 1);

      // parse the vhost in the params of app, that srs supports.
      app = app.replace("...vhost...", "?vhost=");
      if (app.indexOf("?") >= 0) {
        var params = app.slice(app.indexOf("?"));
        app = app.slice(0, app.indexOf("?"));

        if (params.indexOf("vhost=") > 0) {
          vhost = params.slice(params.indexOf("vhost=") + "vhost=".length);
          if (vhost.indexOf("&") > 0) {
            vhost = vhost.slice(0, vhost.indexOf("&"));
          }
        }
      }

      // when vhost equals to server, and server is ip,
      // the vhost is __defaultVhost__
      if (a.hostname === vhost) {
        var re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
        if (re.test(a.hostname)) {
          vhost = "__defaultVhost__";
        }
      }

      // parse the schema
      var schema = "rtmp";
      if (url.indexOf("://") > 0) {
        schema = url.slice(0, url.indexOf("://"));
      }

      var port = a.port;
      if (!port) {
        // Finger out by webrtc url, if contains http or https port, to overwrite default 1985.
        if (schema === "webrtc" && url.indexOf(`webrtc://${a.host}:`) === 0) {
          port = url.indexOf(`webrtc://${a.host}:80`) === 0 ? 80 : 443;
        }

        // Guess by schema.
        if (schema === "http") {
          port = 80;
        } else if (schema === "https") {
          port = 443;
        } else if (schema === "rtmp") {
          port = 1935;
        }
      }

      var ret = {
        url: url,
        schema: schema,
        server: a.hostname,
        port: port,
        vhost: vhost,
        app: app,
        stream: stream
      };
      self.__internal.fill_query(a.search, ret);

      // For webrtc API, we use 443 if page is https, or schema specified it.
      if (!ret.port) {
        if (schema === "webrtc" || schema === "rtc") {
          if (ret.user_query.schema === "https") {
            ret.port = 443;
          } else if (window.location.href.indexOf("https://") === 0) {
            ret.port = 443;
          } else {
            // For WebRTC, SRS use 1985 as default API port.
            ret.port = 1985;
          }
        }
      }

      return ret;
    },
    fill_query: function (query_string, obj) {
      // pure user query object.
      obj.user_query = {};

      if (query_string.length === 0) {
        return;
      }

      // split again for angularjs.
      if (query_string.indexOf("?") >= 0) {
        query_string = query_string.split("?")[1];
      }

      var queries = query_string.split("&");
      for (var i = 0; i < queries.length; i++) {
        var elem = queries[i];

        var query = elem.split("=");
        obj[query[0]] = query[1];
        obj.user_query[query[0]] = query[1];
      }

      // alias domain for vhost.
      if (obj.domain) {
        obj.vhost = obj.domain;
      }
    }
  };

  self.pc = new RTCPeerConnection(null);

  // Create a stream to add track to the stream, @see https://webrtc.org/getting-started/remote-streams
  self.stream = new MediaStream();

  // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ontrack
  self.pc.ontrack = function (event) {
    if (self.ontrack) {
      self.ontrack(event);
    }
  };

  return self;
}

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

    // 获取 sessionId 并初始化 WebRTC
  const sessionId = Math.random().toString(36).substring(2, 15);
  initWebRTC(sessionId);

  const url = 'http://172.16.2.31:8099/digital-person/sse/avatar?question=社保';

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
      accumulatedText += textChunk;

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
  speechSynthesis.speak(utterance);  speechSynthesis.speak(utterance);
};



let peerConnection = null;
const videoElement = ref(null);

// 初始化 WebRTC 连接
const initWebRTC = (sessionId) => {
  // 创建 RTCPeerConnection
  peerConnection = new RTCPeerConnection({
    // 根据需要配置 ICE 服务器 (STUN/TURN)
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  // 设置流媒体到 video 元素
  peerConnection.ontrack = (event) => {
    videoElement.value.srcObject = event.streams[0];
  };

  // 使用 WebSocket 与服务器交换信令
  const ws = new WebSocket(`ws://172.16.2.31:8099/digital-person/ws/${sessionId}`);

  ws.onmessage = (event) => {
    if (event.data.startsWith('webrtc://')) {
    // 处理特定格式的字符串，例如提取视频流地址等
    const videoStreamUrl = event.data; // 假设直接使用此字符串
    // 你可以在这里添加处理 videoStreamUrl 的逻辑
    player.play(videoStreamUrl)
    console.log('Received a video stream URL:', videoStreamUrl);
    // 注意：这里可能需要进一步处理或转换 URL，以便用于 WebRTC 连接
  } else {
    // 尝试将消息解析为 JSON
    try {
      const message = JSON.parse(event.data);
      // 根据解析出的 JSON 对象进行进一步处理
      // 例如处理 WebRTC 的 SDP 信息或 ICE 候选等
    } catch (error) {
      console.error('Error parsing message as JSON:', error);
    }
  }
    // const message = JSON.parse(event.data);

    // // 根据服务器发送的消息类型处理信令
    // if (message.type === 'offer') {
    //   // 处理远端发来的 offer
    //   peerConnection.setRemoteDescription(new RTCSessionDescription(message))
    //     .then(() => peerConnection.createAnswer())
    //     .then(answer => peerConnection.setLocalDescription(answer))
    //     .then(() => ws.send(JSON.stringify(peerConnection.localDescription)));
    // } else if (message.type === 'candidate') {
    //   // 添加 ICE 候选
    //   peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    // }
  };
};


onMounted(() => {
  videoElement.value = document.getElementById('videoElement');
  player = new SrsRtcPlayerAsync();
  player.ontrack = (event) => {
    videoElement.value.srcObject = event.streams[0];
  };
  // 省略其他代码...
});

</script>
