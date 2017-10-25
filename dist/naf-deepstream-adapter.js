/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebRtcPeer = __webpack_require__(1);

var DeepstreamWebRtcAdapter = function () {
  /**
      Config structure:
      config.url: 'YOUR_URL_HERE'
    */
  function DeepstreamWebRtcAdapter(ds, config) {
    _classCallCheck(this, DeepstreamWebRtcAdapter);

    this.rootPath = "networked-aframe";

    this.localId = null;
    this.appId = null;
    this.roomId = null;

    this.peers = {}; // id -> WebRtcPeer
    this.occupants = {}; // id -> joinTimestamp

    config = config || window.deepstreamConfig;
    this.ds = ds || window.deepstream;

    if (this.ds === undefined) {
      throw new Error("Import https://cdnjs.cloudflare.com/ajax/libs/deepstream.io-client-js/x.x.x/deepstream.js");
    }

    this.dsUrl = config.url;
  }

  /*
   * Call before `connect`
   */

  _createClass(DeepstreamWebRtcAdapter, [{
    key: "setServerUrl",
    value: function setServerUrl(url) {
      // handled in config
    }
  }, {
    key: "setApp",
    value: function setApp(appId) {
      this.appId = appId;
    }
  }, {
    key: "setRoom",
    value: function setRoom(roomId) {
      this.roomId = roomId;
    }

    // options: { datachannel: bool, audio: bool }

  }, {
    key: "setWebRtcOptions",
    value: function setWebRtcOptions(options) {
      // TODO: support audio and video
      if (options.datachannel === false) console.warn("DeepstreamWebRtcAdapter.setWebRtcOptions: datachannel must be true.");
      if (options.audio === true) console.warn("DeepstreamWebRtcAdapter does not support audio yet.");
      if (options.video === true) console.warn("DeepstreamWebRtcAdapter does not support video yet.");
    }
  }, {
    key: "setServerConnectListeners",
    value: function setServerConnectListeners(successListener, failureListener) {
      this.connectSuccess = successListener;
      this.connectFailure = failureListener;
    }
  }, {
    key: "setRoomOccupantListener",
    value: function setRoomOccupantListener(occupantListener) {
      this.occupantListener = occupantListener;
    }
  }, {
    key: "setDataChannelListeners",
    value: function setDataChannelListeners(openListener, closedListener, messageListener) {
      this.openListener = openListener;
      this.closedListener = closedListener;
      this.messageListener = messageListener;
    }
  }, {
    key: "connect",
    value: function connect() {
      var self = this;
      var ds = this.ds;

      var dsClient = this.ds(this.dsUrl);
      this.dsClient = dsClient;

      dsClient.login({}, function (success, data) {
        if (success) {
          self.startApp(data.id);
        } else {
          // TODO failure messages
          self.connectFailure();
        }
      });

      dsClient.presence.getAll(function (ids) {
        // ids.forEach(subscribeToAvatarChanges)
        console.log("existing clients", ids);
        for (var i = 0; i < ids.length; i++) {
          self.clientConnected(ids[i]);
        }
      });

      dsClient.presence.subscribe(function (clientId, isOnline) {
        console.log("client presence id", clientId, "online?", isOnline);
        if (isOnline) {
          self.clientConnected(clientId);
        } else {
          self.clientDisconnected(clientId);
        }
      });
    }
  }, {
    key: "shouldStartConnectionTo",
    value: function shouldStartConnectionTo(client) {
      return (this.myRoomJoinTime || 0) <= (client ? client.roomJoinTime : 0);
    }
  }, {
    key: "startStreamConnection",
    value: function startStreamConnection(clientId) {
      // Handled by WebRtcPeer
    }
  }, {
    key: "closeStreamConnection",
    value: function closeStreamConnection(clientId) {
      // Handled by WebRtcPeer
    }
  }, {
    key: "sendData",
    value: function sendData(clientId, dataType, data) {
      this.peers[clientId].send(dataType, data);
    }
  }, {
    key: "sendDataGuaranteed",
    value: function sendDataGuaranteed(clientId, dataType, data) {
      var clonedData = JSON.parse(JSON.stringify(data));
      this.dsClient.record.getRecord(this.getUserPath(this.localId)).set("data", {
        to: clientId,
        type: dataType,
        data: clonedData
      });
    }
  }, {
    key: "broadcastData",
    value: function broadcastData(dataType, data) {
      for (var clientId in this.peers) {
        if (this.peers.hasOwnProperty(clientId)) {
          this.sendData(clientId, dataType, data);
        }
      }
    }
  }, {
    key: "broadcastDataGuaranteed",
    value: function broadcastDataGuaranteed(dataType, data) {
      for (var clientId in this.peers) {
        if (this.peers.hasOwnProperty(clientId)) {
          this.sendDataGuaranteed(clientId, dataType, data);
        }
      }
    }
  }, {
    key: "getConnectStatus",
    value: function getConnectStatus(clientId) {
      var peer = this.peers[clientId];

      if (peer === undefined) return NAF.adapters.NOT_CONNECTED;

      switch (peer.getStatus()) {
        case WebRtcPeer.IS_CONNECTED:
          return NAF.adapters.IS_CONNECTED;

        case WebRtcPeer.CONNECTING:
          return NAF.adapters.CONNECTING;

        case WebRtcPeer.NOT_CONNECTED:
        default:
          return NAF.adapters.NOT_CONNECTED;
      }
    }

    /*
     * Privates
     */

  }, {
    key: "startApp",
    value: function startApp(clientId) {
      var self = this;
      var dsClient = this.dsClient;
      this.localId = clientId;
      this.localTimestamp = NAF.utils.now();

      dsClient.record.getRecord(this.getUserPath(clientId)).set({
        timestamp: this.localTimestamp, // TODO get this from server
        signal: "",
        data: ""
      });
      self.connectSuccess(clientId);
    }
  }, {
    key: "clientConnected",
    value: function clientConnected(clientId) {
      console.log("new client", clientId);
      var self = this;
      var dsClient = this.dsClient;

      if (!NAF.connection.isConnected()) {
        console.warn("Trying to make a connection to another client before my client has connected");
      }

      dsClient.record.getRecord(this.getUserPath(clientId)).whenReady(function (clientRecord) {
        var onClientSetup = function onClientSetup(timestamp) {
          // if (remoteId === self.localId || remoteId === 'timestamp' || self.peers[remoteId] !== undefined) return;

          var remoteTimestamp = clientRecord.get("timestamp");
          console.log("remote timestamp", remoteTimestamp);

          var peer = new WebRtcPeer(self.localId, clientId,
          // send signal function
          function (data) {
            console.log("setting signal", data);
            dsClient.record.getRecord(self.getUserPath(self.localId)).set("signal", data);
          });
          peer.setDatachannelListeners(self.openListener, self.closedListener, self.messageListener);

          self.peers[clientId] = peer;
          self.occupants[clientId] = remoteTimestamp;

          // received signal
          clientRecord.subscribe("signal", function (data) {
            console.log("received signal", data);
            var value = data;
            if (value === null || value === "") return;
            peer.handleSignal(value);
          });

          // received data
          clientRecord.subscribe("data", function (data) {
            console.log("received data", data);
            var value = data;
            if (value === null || value === "" || value.to !== self.localId) return;
            self.messageListener(clientId, value.type, value.data);
          });

          // send offer from a peer who
          //   - later joined the room, or
          //   - has larger id if two peers joined the room at same time
          console.log("checking to see who should send offer", self.localTimestamp > remoteTimestamp, self.localTimestamp === remoteTimestamp && self.localId > clientId);
          if (self.localTimestamp > remoteTimestamp || self.localTimestamp === remoteTimestamp && self.localId > clientId) {
            console.log("this client is sending offer");
            peer.offer();
          }

          self.occupantListener(self.occupants);
        };

        if (clientRecord.get("timestamp") === undefined) {
          clientRecord.subscribe("timestamp", onClientSetup);
        } else {
          onClientSetup(clientRecord.get("timestamp"));
        }
      });
    }
  }, {
    key: "clientDisconnected",
    value: function clientDisconnected() {}
    // TODO


    /*
     * realtime database layout
     *
     * /rootPath/appId/roomId/
     *   - /userId/
     *     - timestamp: joining the room timestamp
     *     - signal: used to send signal
     *     - data: used to send guaranteed data
     *   - /timestamp/: working path to get timestamp
     *     - userId:
     */

  }, {
    key: "getRootPath",
    value: function getRootPath() {
      return this.rootPath;
    }
  }, {
    key: "getAppPath",
    value: function getAppPath() {
      return this.getRootPath() + "/" + this.appId;
    }
  }, {
    key: "getRoomPath",
    value: function getRoomPath() {
      return this.getAppPath() + "/" + this.roomId;
    }
  }, {
    key: "getUserPath",
    value: function getUserPath(id) {
      return this.getRoomPath() + "/" + id;
    }
  }, {
    key: "getSignalPath",
    value: function getSignalPath(id) {
      return this.getUserPath(id) + "/signal";
    }
  }, {
    key: "getDataPath",
    value: function getDataPath(id) {
      return this.getUserPath(id) + "/data";
    }
  }, {
    key: "getTimestampGenerationPath",
    value: function getTimestampGenerationPath(id) {
      return this.getRoomPath() + "/timestamp/" + id;
    }
  }]);

  return DeepstreamWebRtcAdapter;
}();

NAF.adapters.register("deepstream", DeepstreamWebRtcAdapter);

module.exports = DeepstreamWebRtcAdapter;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebRtcPeer = function () {
  function WebRtcPeer(localId, remoteId, sendSignalFunc) {
    _classCallCheck(this, WebRtcPeer);

    this.localId = localId;
    this.remoteId = remoteId;
    this.sendSignalFunc = sendSignalFunc;
    this.open = false;
    this.channelLabel = "networked-aframe-channel";

    this.pc = this.createPeerConnection();
    this.channel = null;
  }

  _createClass(WebRtcPeer, [{
    key: "setDatachannelListeners",
    value: function setDatachannelListeners(openListener, closedListener, messageListener) {
      this.openListener = openListener;
      this.closedListener = closedListener;
      this.messageListener = messageListener;
    }
  }, {
    key: "offer",
    value: function offer() {
      var self = this;
      // reliable: false - UDP
      this.setupChannel(this.pc.createDataChannel(this.channelLabel, { reliable: false }));
      console.log("creating offer");
      this.pc.createOffer(function (sdp) {
        console.log("created offer");
        self.handleSessionDescription(sdp);
      }, function (error) {
        console.error("WebRtcPeer.offer: " + error);
      });
    }
  }, {
    key: "handleSignal",
    value: function handleSignal(signal) {
      console.log("handleSignal", signal);
      // ignores signal if it isn't for me
      if (this.localId !== signal.to || this.remoteId !== signal.from) return;

      switch (signal.type) {
        case "offer":
          this.handleOffer(signal);
          break;

        case "answer":
          this.handleAnswer(signal);
          break;

        case "candidate":
          this.handleCandidate(signal);
          break;

        default:
          console.error("WebRtcPeer.handleSignal: Unknown signal type " + signal.type);
          break;
      }
    }
  }, {
    key: "send",
    value: function send(type, data) {
      // TODO: throw error?
      if (this.channel === null || this.channel.readyState !== "open") return;

      this.channel.send(JSON.stringify({ type: type, data: data }));
    }
  }, {
    key: "getStatus",
    value: function getStatus() {
      if (this.channel === null) return WebRtcPeer.NOT_CONNECTED;

      switch (this.channel.readyState) {
        case "open":
          return WebRtcPeer.IS_CONNECTED;

        case "connecting":
          return WebRtcPeer.CONNECTING;

        case "closing":
        case "closed":
        default:
          return WebRtcPeer.NOT_CONNECTED;
      }
    }

    /*
       * Privates
       */

  }, {
    key: "createPeerConnection",
    value: function createPeerConnection() {
      var self = this;
      var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.msRTCPeerConnection;

      if (RTCPeerConnection === undefined) {
        throw new Error("WebRtcPeer.createPeerConnection: This browser does not seem to support WebRTC.");
      }

      var pc = new RTCPeerConnection({ iceServers: WebRtcPeer.ICE_SERVERS });

      pc.onicecandidate = function (event) {
        console.log("onicecandidate");
        if (event.candidate) {
          self.sendSignalFunc({
            from: self.localId,
            to: self.remoteId,
            type: "candidate",
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate
          });
        }
      };

      // Note: seems like channel.onclose hander is unreliable on some platforms,
      //       so also tries to detect disconnection here.
      pc.oniceconnectionstatechange = function () {
        console.log("oniceconnectionstatechange");
        if (self.open && pc.iceConnectionState === "disconnected") {
          self.open = false;
          self.closedListener(self.remoteId);
        }
      };

      return pc;
    }
  }, {
    key: "setupChannel",
    value: function setupChannel(channel) {
      var self = this;

      this.channel = channel;

      // received data from a remote peer
      this.channel.onmessage = function (event) {
        console.log("received data from remote peer");
        var data = JSON.parse(event.data);
        self.messageListener(self.remoteId, data.type, data.data);
      };

      // connected with a remote peer
      this.channel.onopen = function (event) {
        console.log("connected to a remote peer");
        self.open = true;
        self.openListener(self.remoteId);
      };

      // disconnected with a remote peer
      this.channel.onclose = function (event) {
        console.log("discnnected to a remote peer");
        if (!self.open) return;
        self.open = false;
        self.closedListener(self.remoteId);
      };

      // error occurred with a remote peer
      this.channel.onerror = function (error) {
        console.error("WebRtcPeer.channel.onerror: " + error);
      };
    }
  }, {
    key: "handleOffer",
    value: function handleOffer(message) {
      console.log("handleOffer");
      var self = this;

      this.pc.ondatachannel = function (event) {
        self.setupChannel(event.channel);
      };

      this.setRemoteDescription(message);

      this.pc.createAnswer(function (sdp) {
        self.handleSessionDescription(sdp);
      }, function (error) {
        console.error("WebRtcPeer.handleOffer: " + error);
      });
    }
  }, {
    key: "handleAnswer",
    value: function handleAnswer(message) {
      this.setRemoteDescription(message);
    }
  }, {
    key: "handleCandidate",
    value: function handleCandidate(message) {
      var self = this;
      var RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;

      this.pc.addIceCandidate(new RTCIceCandidate(message), function () {}, function (error) {
        console.error("WebRtcPeer.handleCandidate: " + error);
      });
    }
  }, {
    key: "handleSessionDescription",
    value: function handleSessionDescription(sdp) {
      console.log("handleSessionDescription", sdp);
      var self = this;

      this.pc.setLocalDescription(sdp, function () {}, function (error) {
        console.error("WebRtcPeer.handleSessionDescription: " + error);
      });

      this.sendSignalFunc({
        from: this.localId,
        to: this.remoteId,
        type: sdp.type,
        sdp: sdp.sdp
      });
    }
  }, {
    key: "setRemoteDescription",
    value: function setRemoteDescription(message) {
      var self = this;
      var RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription || window.msRTCSessionDescription;

      this.pc.setRemoteDescription(new RTCSessionDescription(message), function () {}, function (error) {
        console.error("WebRtcPeer.setRemoteDescription: " + error);
      });
    }
  }]);

  return WebRtcPeer;
}();

WebRtcPeer.IS_CONNECTED = "IS_CONNECTED";
WebRtcPeer.CONNECTING = "CONNECTING";
WebRtcPeer.NOT_CONNECTED = "NOT_CONNECTED";

WebRtcPeer.ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }, { urls: "stun:stun2.l.google.com:19302" }, { urls: "stun:stun3.l.google.com:19302" }, { urls: "stun:stun4.l.google.com:19302" }];

module.exports = WebRtcPeer;

/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYjMwM2M3YTFmNTFkMWNhOWEyODQiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9XZWJSdGNQZWVyLmpzIl0sIm5hbWVzIjpbIldlYlJ0Y1BlZXIiLCJyZXF1aXJlIiwiRGVlcHN0cmVhbVdlYlJ0Y0FkYXB0ZXIiLCJkcyIsImNvbmZpZyIsInJvb3RQYXRoIiwibG9jYWxJZCIsImFwcElkIiwicm9vbUlkIiwicGVlcnMiLCJvY2N1cGFudHMiLCJ3aW5kb3ciLCJkZWVwc3RyZWFtQ29uZmlnIiwiZGVlcHN0cmVhbSIsInVuZGVmaW5lZCIsIkVycm9yIiwiZHNVcmwiLCJ1cmwiLCJvcHRpb25zIiwiZGF0YWNoYW5uZWwiLCJjb25zb2xlIiwid2FybiIsImF1ZGlvIiwidmlkZW8iLCJzdWNjZXNzTGlzdGVuZXIiLCJmYWlsdXJlTGlzdGVuZXIiLCJjb25uZWN0U3VjY2VzcyIsImNvbm5lY3RGYWlsdXJlIiwib2NjdXBhbnRMaXN0ZW5lciIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwic2VsZiIsImRzQ2xpZW50IiwibG9naW4iLCJzdWNjZXNzIiwiZGF0YSIsInN0YXJ0QXBwIiwiaWQiLCJwcmVzZW5jZSIsImdldEFsbCIsImlkcyIsImxvZyIsImkiLCJsZW5ndGgiLCJjbGllbnRDb25uZWN0ZWQiLCJzdWJzY3JpYmUiLCJjbGllbnRJZCIsImlzT25saW5lIiwiY2xpZW50RGlzY29ubmVjdGVkIiwiY2xpZW50IiwibXlSb29tSm9pblRpbWUiLCJyb29tSm9pblRpbWUiLCJkYXRhVHlwZSIsInNlbmQiLCJjbG9uZWREYXRhIiwiSlNPTiIsInBhcnNlIiwic3RyaW5naWZ5IiwicmVjb3JkIiwiZ2V0UmVjb3JkIiwiZ2V0VXNlclBhdGgiLCJzZXQiLCJ0byIsInR5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsInNlbmREYXRhIiwic2VuZERhdGFHdWFyYW50ZWVkIiwicGVlciIsIk5BRiIsImFkYXB0ZXJzIiwiTk9UX0NPTk5FQ1RFRCIsImdldFN0YXR1cyIsIklTX0NPTk5FQ1RFRCIsIkNPTk5FQ1RJTkciLCJsb2NhbFRpbWVzdGFtcCIsInV0aWxzIiwibm93IiwidGltZXN0YW1wIiwic2lnbmFsIiwiY29ubmVjdGlvbiIsImlzQ29ubmVjdGVkIiwid2hlblJlYWR5IiwiY2xpZW50UmVjb3JkIiwib25DbGllbnRTZXR1cCIsInJlbW90ZVRpbWVzdGFtcCIsImdldCIsInNldERhdGFjaGFubmVsTGlzdGVuZXJzIiwidmFsdWUiLCJoYW5kbGVTaWduYWwiLCJvZmZlciIsImdldFJvb3RQYXRoIiwiZ2V0QXBwUGF0aCIsImdldFJvb21QYXRoIiwicmVnaXN0ZXIiLCJtb2R1bGUiLCJleHBvcnRzIiwicmVtb3RlSWQiLCJzZW5kU2lnbmFsRnVuYyIsIm9wZW4iLCJjaGFubmVsTGFiZWwiLCJwYyIsImNyZWF0ZVBlZXJDb25uZWN0aW9uIiwiY2hhbm5lbCIsInNldHVwQ2hhbm5lbCIsImNyZWF0ZURhdGFDaGFubmVsIiwicmVsaWFibGUiLCJjcmVhdGVPZmZlciIsInNkcCIsImhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbiIsImVycm9yIiwiZnJvbSIsImhhbmRsZU9mZmVyIiwiaGFuZGxlQW5zd2VyIiwiaGFuZGxlQ2FuZGlkYXRlIiwicmVhZHlTdGF0ZSIsIlJUQ1BlZXJDb25uZWN0aW9uIiwid2Via2l0UlRDUGVlckNvbm5lY3Rpb24iLCJtb3pSVENQZWVyQ29ubmVjdGlvbiIsIm1zUlRDUGVlckNvbm5lY3Rpb24iLCJpY2VTZXJ2ZXJzIiwiSUNFX1NFUlZFUlMiLCJvbmljZWNhbmRpZGF0ZSIsImV2ZW50IiwiY2FuZGlkYXRlIiwic2RwTUxpbmVJbmRleCIsIm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlIiwiaWNlQ29ubmVjdGlvblN0YXRlIiwib25tZXNzYWdlIiwib25vcGVuIiwib25jbG9zZSIsIm9uZXJyb3IiLCJtZXNzYWdlIiwib25kYXRhY2hhbm5lbCIsInNldFJlbW90ZURlc2NyaXB0aW9uIiwiY3JlYXRlQW5zd2VyIiwiUlRDSWNlQ2FuZGlkYXRlIiwid2Via2l0UlRDSWNlQ2FuZGlkYXRlIiwibW96UlRDSWNlQ2FuZGlkYXRlIiwiYWRkSWNlQ2FuZGlkYXRlIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsIlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIndlYmtpdFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIm1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIm1zUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIiwidXJscyJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7OztBQzdEQSxJQUFJQSxhQUFhLG1CQUFBQyxDQUFRLENBQVIsQ0FBakI7O0lBRU1DLHVCO0FBQ0o7Ozs7QUFJQSxtQ0FBWUMsRUFBWixFQUFnQkMsTUFBaEIsRUFBd0I7QUFBQTs7QUFDdEIsU0FBS0MsUUFBTCxHQUFnQixrQkFBaEI7O0FBRUEsU0FBS0MsT0FBTCxHQUFlLElBQWY7QUFDQSxTQUFLQyxLQUFMLEdBQWEsSUFBYjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxJQUFkOztBQUVBLFNBQUtDLEtBQUwsR0FBYSxFQUFiLENBUHNCLENBT0w7QUFDakIsU0FBS0MsU0FBTCxHQUFpQixFQUFqQixDQVJzQixDQVFEOztBQUVy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QUFTRSxLQUFULEVBQWdCO0FBQ2QxRixnQkFBUTBGLEtBQVIsQ0FBYywwQ0FBMENBLEtBQXhEO0FBQ0QsT0FMSDs7QUFRQSxXQUFLWixjQUFMLENBQW9CO0FBQ2xCYSxjQUFNLEtBQUt6RyxPQURPO0FBRWxCeUQsWUFBSSxLQUFLa0MsUUFGUztBQUdsQmpDLGNBQU00QyxJQUFJNUMsSUFIUTtBQUlsQjRDLGFBQUtBLElBQUlBO0FBSlMsT0FBcEI7QUFNRDs7O3lDQUVvQndCLE8sRUFBUztBQUM1QixVQUFJcEcsT0FBTyxJQUFYO0FBQ0EsVUFBSTZHLHdCQUNGbEksT0FBT2tJLHFCQUFQLElBQ0FsSSxPQUFPbUksMkJBRFAsSUFFQW5JLE9BQU9vSSx3QkFGUCxJQUdBcEksT0FBT3FJLHVCQUpUOztBQU1BLFdBQUszQyxFQUFMLENBQVFpQyxvQkFBUixDQUNFLElBQUlPLHFCQUFKLENBQTBCVCxPQUExQixDQURGLEVBRUUsWUFBVyxDQUFFLENBRmYsRUFHRSxVQUFTdEIsS0FBVCxFQUFnQjtBQUNkMUYsZ0JBQVEwRixLQUFSLENBQWMsc0NBQXNDQSxLQUFwRDtBQUNELE9BTEg7QUFPRDs7Ozs7O0FBR0g5RyxXQUFXeUUsWUFBWCxHQUEwQixjQUExQjtBQUNBekUsV0FBVzBFLFVBQVgsR0FBd0IsWUFBeEI7QUFDQTFFLFdBQVd1RSxhQUFYLEdBQTJCLGVBQTNCOztBQUVBdkUsV0FBV3lILFdBQVgsR0FBeUIsQ0FDdkIsRUFBRXdCLE1BQU0sOEJBQVIsRUFEdUIsRUFFdkIsRUFBRUEsTUFBTSwrQkFBUixFQUZ1QixFQUd2QixFQUFFQSxNQUFNLCtCQUFSLEVBSHVCLEVBSXZCLEVBQUVBLE1BQU0sK0JBQVIsRUFKdUIsRUFLdkIsRUFBRUEsTUFBTSwrQkFBUixFQUx1QixDQUF6Qjs7QUFRQWxELE9BQU9DLE9BQVAsR0FBaUJoRyxVQUFqQixDIiwiZmlsZSI6Im5hZi1kZWVwc3RyZWFtLWFkYXB0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHtcbiBcdFx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuIFx0XHRcdFx0Z2V0OiBnZXR0ZXJcbiBcdFx0XHR9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSAwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCBiMzAzYzdhMWY1MWQxY2E5YTI4NCIsInZhciBXZWJSdGNQZWVyID0gcmVxdWlyZShcIi4vV2ViUnRjUGVlclwiKTtcclxuXHJcbmNsYXNzIERlZXBzdHJlYW1XZWJSdGNBZGFwdGVyIHtcclxuICAvKipcclxuICAgICAgQ29uZmlnIHN0cnVjdHVyZTpcclxuICAgICAgY29uZmlnLnVybDogJ1lPVVJfVVJMX0hFUkUnXHJcbiAgICAqL1xyXG4gIGNvbnN0cnVjdG9yKGRzLCBjb25maWcpIHtcclxuICAgIHRoaXMucm9vdFBhdGggPSBcIm5ldHdvcmtlZC1hZnJhbWVcIjtcclxuXHJcbiAgICB0aGlzLmxvY2FsSWQgPSBudWxsO1xyXG4gICAgdGhpcy5hcHBJZCA9IG51bGw7XHJcbiAgICB0aGlzLnJvb21JZCA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5wZWVycyA9IHt9OyAvLyBpZCAtPiBXZWJSdGNQZWVyXHJcbiAgICB0aGlzLm9jY3VwYW50cyA9IHt9OyAvLyBpZCAtPiBqb2luVGltZXN0YW1wXHJcblxyXG4gICAgY29uZmlnID0gY29uZmlnIHx8IHdpbmRvdy5kZWVwc3RyZWFtQ29uZmlnO1xyXG4gICAgdGhpcy5kcyA9IGRzIHx8IHdpbmRvdy5kZWVwc3RyZWFtO1xyXG5cclxuICAgIGlmICh0aGlzLmRzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgIFwiSW1wb3J0IGh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2RlZXBzdHJlYW0uaW8tY2xpZW50LWpzL3gueC54L2RlZXBzdHJlYW0uanNcIlxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZHNVcmwgPSBjb25maWcudXJsO1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgKiBDYWxsIGJlZm9yZSBgY29ubmVjdGBcclxuICAgKi9cclxuXHJcbiAgc2V0U2VydmVyVXJsKHVybCkge1xyXG4gICAgLy8gaGFuZGxlZCBpbiBjb25maWdcclxuICB9XHJcblxyXG4gIHNldEFwcChhcHBJZCkge1xyXG4gICAgdGhpcy5hcHBJZCA9IGFwcElkO1xyXG4gIH1cclxuXHJcbiAgc2V0Um9vbShyb29tSWQpIHtcclxuICAgIHRoaXMucm9vbUlkID0gcm9vbUlkO1xyXG4gIH1cclxuXHJcbiAgLy8gb3B0aW9uczogeyBkYXRhY2hhbm5lbDogYm9vbCwgYXVkaW86IGJvb2wgfVxyXG4gIHNldFdlYlJ0Y09wdGlvbnMob3B0aW9ucykge1xyXG4gICAgLy8gVE9ETzogc3VwcG9ydCBhdWRpbyBhbmQgdmlkZW9cclxuICAgIGlmIChvcHRpb25zLmRhdGFjaGFubmVsID09PSBmYWxzZSlcclxuICAgICAgY29uc29sZS53YXJuKFxyXG4gICAgICAgIFwiRGVlcHN0cmVhbVdlYlJ0Y0FkYXB0ZXIuc2V0V2ViUnRjT3B0aW9uczogZGF0YWNoYW5uZWwgbXVzdCBiZSB0cnVlLlwiXHJcbiAgICAgICk7XHJcbiAgICBpZiAob3B0aW9ucy5hdWRpbyA9PT0gdHJ1ZSlcclxuICAgICAgY29uc29sZS53YXJuKFwiRGVlcHN0cmVhbVdlYlJ0Y0FkYXB0ZXIgZG9lcyBub3Qgc3VwcG9ydCBhdWRpbyB5ZXQuXCIpO1xyXG4gICAgaWYgKG9wdGlvbnMudmlkZW8gPT09IHRydWUpXHJcbiAgICAgIGNvbnNvbGUud2FybihcIkRlZXBzdHJlYW1XZWJSdGNBZGFwdGVyIGRvZXMgbm90IHN1cHBvcnQgdmlkZW8geWV0LlwiKTtcclxuICB9XHJcblxyXG4gIHNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMoc3VjY2Vzc0xpc3RlbmVyLCBmYWlsdXJlTGlzdGVuZXIpIHtcclxuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3MgPSBzdWNjZXNzTGlzdGVuZXI7XHJcbiAgICB0aGlzLmNvbm5lY3RGYWlsdXJlID0gZmFpbHVyZUxpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgc2V0Um9vbU9jY3VwYW50TGlzdGVuZXIob2NjdXBhbnRMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vY2N1cGFudExpc3RlbmVyID0gb2NjdXBhbnRMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vcGVuTGlzdGVuZXIgPSBvcGVuTGlzdGVuZXI7XHJcbiAgICB0aGlzLmNsb3NlZExpc3RlbmVyID0gY2xvc2VkTGlzdGVuZXI7XHJcbiAgICB0aGlzLm1lc3NhZ2VMaXN0ZW5lciA9IG1lc3NhZ2VMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIGNvbm5lY3QoKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB2YXIgZHMgPSB0aGlzLmRzO1xyXG5cclxuICAgIHZhciBkc0NsaWVudCA9IHRoaXMuZHModGhpcy5kc1VybCk7XHJcbiAgICB0aGlzLmRzQ2xpZW50ID0gZHNDbGllbnQ7XHJcblxyXG4gICAgZHNDbGllbnQubG9naW4oe30sIGZ1bmN0aW9uKHN1Y2Nlc3MsIGRhdGEpIHtcclxuICAgICAgaWYgKHN1Y2Nlc3MpIHtcclxuICAgICAgICBzZWxmLnN0YXJ0QXBwKGRhdGEuaWQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIFRPRE8gZmFpbHVyZSBtZXNzYWdlc1xyXG4gICAgICAgIHNlbGYuY29ubmVjdEZhaWx1cmUoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZHNDbGllbnQucHJlc2VuY2UuZ2V0QWxsKGZ1bmN0aW9uKGlkcykge1xyXG4gICAgICAvLyBpZHMuZm9yRWFjaChzdWJzY3JpYmVUb0F2YXRhckNoYW5nZXMpXHJcbiAgICAgIGNvbnNvbGUubG9nKFwiZXhpc3RpbmcgY2xpZW50c1wiLCBpZHMpO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGlkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHNlbGYuY2xpZW50Q29ubmVjdGVkKGlkc1tpXSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGRzQ2xpZW50LnByZXNlbmNlLnN1YnNjcmliZSgoY2xpZW50SWQsIGlzT25saW5lKSA9PiB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiY2xpZW50IHByZXNlbmNlIGlkXCIsIGNsaWVudElkLCBcIm9ubGluZT9cIiwgaXNPbmxpbmUpO1xyXG4gICAgICBpZiAoaXNPbmxpbmUpIHtcclxuICAgICAgICBzZWxmLmNsaWVudENvbm5lY3RlZChjbGllbnRJZCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2VsZi5jbGllbnREaXNjb25uZWN0ZWQoY2xpZW50SWQpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNob3VsZFN0YXJ0Q29ubmVjdGlvblRvKGNsaWVudCkge1xyXG4gICAgcmV0dXJuICh0aGlzLm15Um9vbUpvaW5UaW1lIHx8IDApIDw9IChjbGllbnQgPyBjbGllbnQucm9vbUpvaW5UaW1lIDogMCk7XHJcbiAgfVxyXG5cclxuICBzdGFydFN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHtcclxuICAgIC8vIEhhbmRsZWQgYnkgV2ViUnRjUGVlclxyXG4gIH1cclxuXHJcbiAgY2xvc2VTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7XHJcbiAgICAvLyBIYW5kbGVkIGJ5IFdlYlJ0Y1BlZXJcclxuICB9XHJcblxyXG4gIHNlbmREYXRhKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wZWVyc1tjbGllbnRJZF0uc2VuZChkYXRhVHlwZSwgZGF0YSk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YUd1YXJhbnRlZWQoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB2YXIgY2xvbmVkRGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgdGhpcy5kc0NsaWVudC5yZWNvcmQuZ2V0UmVjb3JkKHRoaXMuZ2V0VXNlclBhdGgodGhpcy5sb2NhbElkKSkuc2V0KFwiZGF0YVwiLCB7XHJcbiAgICAgIHRvOiBjbGllbnRJZCxcclxuICAgICAgdHlwZTogZGF0YVR5cGUsXHJcbiAgICAgIGRhdGE6IGNsb25lZERhdGFcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgYnJvYWRjYXN0RGF0YShkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgZm9yICh2YXIgY2xpZW50SWQgaW4gdGhpcy5wZWVycykge1xyXG4gICAgICBpZiAodGhpcy5wZWVycy5oYXNPd25Qcm9wZXJ0eShjbGllbnRJZCkpIHtcclxuICAgICAgICB0aGlzLnNlbmREYXRhKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGJyb2FkY2FzdERhdGFHdWFyYW50ZWVkKGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICBmb3IgKHZhciBjbGllbnRJZCBpbiB0aGlzLnBlZXJzKSB7XHJcbiAgICAgIGlmICh0aGlzLnBlZXJzLmhhc093blByb3BlcnR5KGNsaWVudElkKSkge1xyXG4gICAgICAgIHRoaXMuc2VuZERhdGFHdWFyYW50ZWVkKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGdldENvbm5lY3RTdGF0dXMoY2xpZW50SWQpIHtcclxuICAgIHZhciBwZWVyID0gdGhpcy5wZWVyc1tjbGllbnRJZF07XHJcblxyXG4gICAgaWYgKHBlZXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuIE5BRi5hZGFwdGVycy5OT1RfQ09OTkVDVEVEO1xyXG5cclxuICAgIHN3aXRjaCAocGVlci5nZXRTdGF0dXMoKSkge1xyXG4gICAgICBjYXNlIFdlYlJ0Y1BlZXIuSVNfQ09OTkVDVEVEOlxyXG4gICAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuSVNfQ09OTkVDVEVEO1xyXG5cclxuICAgICAgY2FzZSBXZWJSdGNQZWVyLkNPTk5FQ1RJTkc6XHJcbiAgICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5DT05ORUNUSU5HO1xyXG5cclxuICAgICAgY2FzZSBXZWJSdGNQZWVyLk5PVF9DT05ORUNURUQ6XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5OT1RfQ09OTkVDVEVEO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLypcclxuICAgKiBQcml2YXRlc1xyXG4gICAqL1xyXG5cclxuICBzdGFydEFwcChjbGllbnRJZCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIGRzQ2xpZW50ID0gdGhpcy5kc0NsaWVudDtcclxuICAgIHRoaXMubG9jYWxJZCA9IGNsaWVudElkO1xyXG4gICAgdGhpcy5sb2NhbFRpbWVzdGFtcCA9IE5BRi51dGlscy5ub3coKTtcclxuXHJcbiAgICBkc0NsaWVudC5yZWNvcmQuZ2V0UmVjb3JkKHRoaXMuZ2V0VXNlclBhdGgoY2xpZW50SWQpKS5zZXQoe1xyXG4gICAgICB0aW1lc3RhbXA6IHRoaXMubG9jYWxUaW1lc3RhbXAsIC8vIFRPRE8gZ2V0IHRoaXMgZnJvbSBzZXJ2ZXJcclxuICAgICAgc2lnbmFsOiBcIlwiLFxyXG4gICAgICBkYXRhOiBcIlwiXHJcbiAgICB9KTtcclxuICAgIHNlbGYuY29ubmVjdFN1Y2Nlc3MoY2xpZW50SWQpO1xyXG4gIH1cclxuXHJcbiAgY2xpZW50Q29ubmVjdGVkKGNsaWVudElkKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIm5ldyBjbGllbnRcIiwgY2xpZW50SWQpO1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIGRzQ2xpZW50ID0gdGhpcy5kc0NsaWVudDtcclxuXHJcbiAgICBpZiAoIU5BRi5jb25uZWN0aW9uLmlzQ29ubmVjdGVkKCkpIHtcclxuICAgICAgY29uc29sZS53YXJuKFxyXG4gICAgICAgIFwiVHJ5aW5nIHRvIG1ha2UgYSBjb25uZWN0aW9uIHRvIGFub3RoZXIgY2xpZW50IGJlZm9yZSBteSBjbGllbnQgaGFzIGNvbm5lY3RlZFwiXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgZHNDbGllbnQucmVjb3JkXHJcbiAgICAgIC5nZXRSZWNvcmQodGhpcy5nZXRVc2VyUGF0aChjbGllbnRJZCkpXHJcbiAgICAgIC53aGVuUmVhZHkoZnVuY3Rpb24oY2xpZW50UmVjb3JkKSB7XHJcbiAgICAgICAgdmFyIG9uQ2xpZW50U2V0dXAgPSBmdW5jdGlvbih0aW1lc3RhbXApIHtcclxuICAgICAgICAgIC8vIGlmIChyZW1vdGVJZCA9PT0gc2VsZi5sb2NhbElkIHx8IHJlbW90ZUlkID09PSAndGltZXN0YW1wJyB8fCBzZWxmLnBlZXJzW3JlbW90ZUlkXSAhPT0gdW5kZWZpbmVkKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgdmFyIHJlbW90ZVRpbWVzdGFtcCA9IGNsaWVudFJlY29yZC5nZXQoXCJ0aW1lc3RhbXBcIik7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInJlbW90ZSB0aW1lc3RhbXBcIiwgcmVtb3RlVGltZXN0YW1wKTtcclxuXHJcbiAgICAgICAgICB2YXIgcGVlciA9IG5ldyBXZWJSdGNQZWVyKFxyXG4gICAgICAgICAgICBzZWxmLmxvY2FsSWQsXHJcbiAgICAgICAgICAgIGNsaWVudElkLFxyXG4gICAgICAgICAgICAvLyBzZW5kIHNpZ25hbCBmdW5jdGlvblxyXG4gICAgICAgICAgICBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzZXR0aW5nIHNpZ25hbFwiLCBkYXRhKTtcclxuICAgICAgICAgICAgICBkc0NsaWVudC5yZWNvcmRcclxuICAgICAgICAgICAgICAgIC5nZXRSZWNvcmQoc2VsZi5nZXRVc2VyUGF0aChzZWxmLmxvY2FsSWQpKVxyXG4gICAgICAgICAgICAgICAgLnNldChcInNpZ25hbFwiLCBkYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIHBlZXIuc2V0RGF0YWNoYW5uZWxMaXN0ZW5lcnMoXHJcbiAgICAgICAgICAgIHNlbGYub3Blbkxpc3RlbmVyLFxyXG4gICAgICAgICAgICBzZWxmLmNsb3NlZExpc3RlbmVyLFxyXG4gICAgICAgICAgICBzZWxmLm1lc3NhZ2VMaXN0ZW5lclxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBzZWxmLnBlZXJzW2NsaWVudElkXSA9IHBlZXI7XHJcbiAgICAgICAgICBzZWxmLm9jY3VwYW50c1tjbGllbnRJZF0gPSByZW1vdGVUaW1lc3RhbXA7XHJcblxyXG4gICAgICAgICAgLy8gcmVjZWl2ZWQgc2lnbmFsXHJcbiAgICAgICAgICBjbGllbnRSZWNvcmQuc3Vic2NyaWJlKFwic2lnbmFsXCIsIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJyZWNlaXZlZCBzaWduYWxcIiwgZGF0YSk7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGE7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gXCJcIikgcmV0dXJuO1xyXG4gICAgICAgICAgICBwZWVyLmhhbmRsZVNpZ25hbCh2YWx1ZSk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAvLyByZWNlaXZlZCBkYXRhXHJcbiAgICAgICAgICBjbGllbnRSZWNvcmQuc3Vic2NyaWJlKFwiZGF0YVwiLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVjZWl2ZWQgZGF0YVwiLCBkYXRhKTtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSBcIlwiIHx8IHZhbHVlLnRvICE9PSBzZWxmLmxvY2FsSWQpXHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBzZWxmLm1lc3NhZ2VMaXN0ZW5lcihjbGllbnRJZCwgdmFsdWUudHlwZSwgdmFsdWUuZGF0YSk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAvLyBzZW5kIG9mZmVyIGZyb20gYSBwZWVyIHdob1xyXG4gICAgICAgICAgLy8gICAtIGxhdGVyIGpvaW5lZCB0aGUgcm9vbSwgb3JcclxuICAgICAgICAgIC8vICAgLSBoYXMgbGFyZ2VyIGlkIGlmIHR3byBwZWVycyBqb2luZWQgdGhlIHJvb20gYXQgc2FtZSB0aW1lXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgXCJjaGVja2luZyB0byBzZWUgd2hvIHNob3VsZCBzZW5kIG9mZmVyXCIsXHJcbiAgICAgICAgICAgIHNlbGYubG9jYWxUaW1lc3RhbXAgPiByZW1vdGVUaW1lc3RhbXAsXHJcbiAgICAgICAgICAgIHNlbGYubG9jYWxUaW1lc3RhbXAgPT09IHJlbW90ZVRpbWVzdGFtcCAmJiBzZWxmLmxvY2FsSWQgPiBjbGllbnRJZFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgc2VsZi5sb2NhbFRpbWVzdGFtcCA+IHJlbW90ZVRpbWVzdGFtcCB8fFxyXG4gICAgICAgICAgICAoc2VsZi5sb2NhbFRpbWVzdGFtcCA9PT0gcmVtb3RlVGltZXN0YW1wICYmIHNlbGYubG9jYWxJZCA+IGNsaWVudElkKVxyXG4gICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidGhpcyBjbGllbnQgaXMgc2VuZGluZyBvZmZlclwiKTtcclxuICAgICAgICAgICAgcGVlci5vZmZlcigpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHNlbGYub2NjdXBhbnRMaXN0ZW5lcihzZWxmLm9jY3VwYW50cyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKGNsaWVudFJlY29yZC5nZXQoXCJ0aW1lc3RhbXBcIikgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgY2xpZW50UmVjb3JkLnN1YnNjcmliZShcInRpbWVzdGFtcFwiLCBvbkNsaWVudFNldHVwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgb25DbGllbnRTZXR1cChjbGllbnRSZWNvcmQuZ2V0KFwidGltZXN0YW1wXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgY2xpZW50RGlzY29ubmVjdGVkKCkge1xyXG4gICAgLy8gVE9ET1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgKiByZWFsdGltZSBkYXRhYmFzZSBsYXlvdXRcclxuICAgKlxyXG4gICAqIC9yb290UGF0aC9hcHBJZC9yb29tSWQvXHJcbiAgICogICAtIC91c2VySWQvXHJcbiAgICogICAgIC0gdGltZXN0YW1wOiBqb2luaW5nIHRoZSByb29tIHRpbWVzdGFtcFxyXG4gICAqICAgICAtIHNpZ25hbDogdXNlZCB0byBzZW5kIHNpZ25hbFxyXG4gICAqICAgICAtIGRhdGE6IHVzZWQgdG8gc2VuZCBndWFyYW50ZWVkIGRhdGFcclxuICAgKiAgIC0gL3RpbWVzdGFtcC86IHdvcmtpbmcgcGF0aCB0byBnZXQgdGltZXN0YW1wXHJcbiAgICogICAgIC0gdXNlcklkOlxyXG4gICAqL1xyXG5cclxuICBnZXRSb290UGF0aCgpIHtcclxuICAgIHJldHVybiB0aGlzLnJvb3RQYXRoO1xyXG4gIH1cclxuXHJcbiAgZ2V0QXBwUGF0aCgpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFJvb3RQYXRoKCkgKyBcIi9cIiArIHRoaXMuYXBwSWQ7XHJcbiAgfVxyXG5cclxuICBnZXRSb29tUGF0aCgpIHtcclxuICAgIHJldHVybiB0aGlzLmdldEFwcFBhdGgoKSArIFwiL1wiICsgdGhpcy5yb29tSWQ7XHJcbiAgfVxyXG5cclxuICBnZXRVc2VyUGF0aChpZCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Um9vbVBhdGgoKSArIFwiL1wiICsgaWQ7XHJcbiAgfVxyXG5cclxuICBnZXRTaWduYWxQYXRoKGlkKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRVc2VyUGF0aChpZCkgKyBcIi9zaWduYWxcIjtcclxuICB9XHJcblxyXG4gIGdldERhdGFQYXRoKGlkKSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRVc2VyUGF0aChpZCkgKyBcIi9kYXRhXCI7XHJcbiAgfVxyXG5cclxuICBnZXRUaW1lc3RhbXBHZW5lcmF0aW9uUGF0aChpZCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Um9vbVBhdGgoKSArIFwiL3RpbWVzdGFtcC9cIiArIGlkO1xyXG4gIH1cclxufVxyXG5cclxuTkFGLmFkYXB0ZXJzLnJlZ2lzdGVyKFwiZGVlcHN0cmVhbVwiLCBEZWVwc3RyZWFtV2ViUnRjQWRhcHRlcik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERlZXBzdHJlYW1XZWJSdGNBZGFwdGVyO1xyXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvaW5kZXguanMiLCJjbGFzcyBXZWJSdGNQZWVyIHtcclxuICBjb25zdHJ1Y3Rvcihsb2NhbElkLCByZW1vdGVJZCwgc2VuZFNpZ25hbEZ1bmMpIHtcclxuICAgIHRoaXMubG9jYWxJZCA9IGxvY2FsSWQ7XHJcbiAgICB0aGlzLnJlbW90ZUlkID0gcmVtb3RlSWQ7XHJcbiAgICB0aGlzLnNlbmRTaWduYWxGdW5jID0gc2VuZFNpZ25hbEZ1bmM7XHJcbiAgICB0aGlzLm9wZW4gPSBmYWxzZTtcclxuICAgIHRoaXMuY2hhbm5lbExhYmVsID0gXCJuZXR3b3JrZWQtYWZyYW1lLWNoYW5uZWxcIjtcclxuXHJcbiAgICB0aGlzLnBjID0gdGhpcy5jcmVhdGVQZWVyQ29ubmVjdGlvbigpO1xyXG4gICAgdGhpcy5jaGFubmVsID0gbnVsbDtcclxuICB9XHJcblxyXG4gIHNldERhdGFjaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vcGVuTGlzdGVuZXIgPSBvcGVuTGlzdGVuZXI7XHJcbiAgICB0aGlzLmNsb3NlZExpc3RlbmVyID0gY2xvc2VkTGlzdGVuZXI7XHJcbiAgICB0aGlzLm1lc3NhZ2VMaXN0ZW5lciA9IG1lc3NhZ2VMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIG9mZmVyKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgLy8gcmVsaWFibGU6IGZhbHNlIC0gVURQXHJcbiAgICB0aGlzLnNldHVwQ2hhbm5lbChcclxuICAgICAgdGhpcy5wYy5jcmVhdGVEYXRhQ2hhbm5lbCh0aGlzLmNoYW5uZWxMYWJlbCwgeyByZWxpYWJsZTogZmFsc2UgfSlcclxuICAgICk7XHJcbiAgICBjb25zb2xlLmxvZyhcImNyZWF0aW5nIG9mZmVyXCIpO1xyXG4gICAgdGhpcy5wYy5jcmVhdGVPZmZlcihcclxuICAgICAgZnVuY3Rpb24oc2RwKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJjcmVhdGVkIG9mZmVyXCIpO1xyXG4gICAgICAgIHNlbGYuaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uKHNkcCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIldlYlJ0Y1BlZXIub2ZmZXI6IFwiICsgZXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgaGFuZGxlU2lnbmFsKHNpZ25hbCkge1xyXG4gICAgY29uc29sZS5sb2coXCJoYW5kbGVTaWduYWxcIiwgc2lnbmFsKTtcclxuICAgIC8vIGlnbm9yZXMgc2lnbmFsIGlmIGl0IGlzbid0IGZvciBtZVxyXG4gICAgaWYgKHRoaXMubG9jYWxJZCAhPT0gc2lnbmFsLnRvIHx8IHRoaXMucmVtb3RlSWQgIT09IHNpZ25hbC5mcm9tKSByZXR1cm47XHJcblxyXG4gICAgc3dpdGNoIChzaWduYWwudHlwZSkge1xyXG4gICAgICBjYXNlIFwib2ZmZXJcIjpcclxuICAgICAgICB0aGlzLmhhbmRsZU9mZmVyKHNpZ25hbCk7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIFwiYW5zd2VyXCI6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVBbnN3ZXIoc2lnbmFsKTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgXCJjYW5kaWRhdGVcIjpcclxuICAgICAgICB0aGlzLmhhbmRsZUNhbmRpZGF0ZShzaWduYWwpO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgXCJXZWJSdGNQZWVyLmhhbmRsZVNpZ25hbDogVW5rbm93biBzaWduYWwgdHlwZSBcIiArIHNpZ25hbC50eXBlXHJcbiAgICAgICAgKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNlbmQodHlwZSwgZGF0YSkge1xyXG4gICAgLy8gVE9ETzogdGhyb3cgZXJyb3I/XHJcbiAgICBpZiAodGhpcy5jaGFubmVsID09PSBudWxsIHx8IHRoaXMuY2hhbm5lbC5yZWFkeVN0YXRlICE9PSBcIm9wZW5cIikgcmV0dXJuO1xyXG5cclxuICAgIHRoaXMuY2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgdHlwZTogdHlwZSwgZGF0YTogZGF0YSB9KSk7XHJcbiAgfVxyXG5cclxuICBnZXRTdGF0dXMoKSB7XHJcbiAgICBpZiAodGhpcy5jaGFubmVsID09PSBudWxsKSByZXR1cm4gV2ViUnRjUGVlci5OT1RfQ09OTkVDVEVEO1xyXG5cclxuICAgIHN3aXRjaCAodGhpcy5jaGFubmVsLnJlYWR5U3RhdGUpIHtcclxuICAgICAgY2FzZSBcIm9wZW5cIjpcclxuICAgICAgICByZXR1cm4gV2ViUnRjUGVlci5JU19DT05ORUNURUQ7XHJcblxyXG4gICAgICBjYXNlIFwiY29ubmVjdGluZ1wiOlxyXG4gICAgICAgIHJldHVybiBXZWJSdGNQZWVyLkNPTk5FQ1RJTkc7XHJcblxyXG4gICAgICBjYXNlIFwiY2xvc2luZ1wiOlxyXG4gICAgICBjYXNlIFwiY2xvc2VkXCI6XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIFdlYlJ0Y1BlZXIuTk9UX0NPTk5FQ1RFRDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qXHJcbiAgICAgKiBQcml2YXRlc1xyXG4gICAgICovXHJcblxyXG4gIGNyZWF0ZVBlZXJDb25uZWN0aW9uKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIFJUQ1BlZXJDb25uZWN0aW9uID1cclxuICAgICAgd2luZG93LlJUQ1BlZXJDb25uZWN0aW9uIHx8XHJcbiAgICAgIHdpbmRvdy53ZWJraXRSVENQZWVyQ29ubmVjdGlvbiB8fFxyXG4gICAgICB3aW5kb3cubW96UlRDUGVlckNvbm5lY3Rpb24gfHxcclxuICAgICAgd2luZG93Lm1zUlRDUGVlckNvbm5lY3Rpb247XHJcblxyXG4gICAgaWYgKFJUQ1BlZXJDb25uZWN0aW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgIFwiV2ViUnRjUGVlci5jcmVhdGVQZWVyQ29ubmVjdGlvbjogVGhpcyBicm93c2VyIGRvZXMgbm90IHNlZW0gdG8gc3VwcG9ydCBXZWJSVEMuXCJcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcGMgPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oeyBpY2VTZXJ2ZXJzOiBXZWJSdGNQZWVyLklDRV9TRVJWRVJTIH0pO1xyXG5cclxuICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgY29uc29sZS5sb2coXCJvbmljZWNhbmRpZGF0ZVwiKTtcclxuICAgICAgaWYgKGV2ZW50LmNhbmRpZGF0ZSkge1xyXG4gICAgICAgIHNlbGYuc2VuZFNpZ25hbEZ1bmMoe1xyXG4gICAgICAgICAgZnJvbTogc2VsZi5sb2NhbElkLFxyXG4gICAgICAgICAgdG86IHNlbGYucmVtb3RlSWQsXHJcbiAgICAgICAgICB0eXBlOiBcImNhbmRpZGF0ZVwiLFxyXG4gICAgICAgICAgc2RwTUxpbmVJbmRleDogZXZlbnQuY2FuZGlkYXRlLnNkcE1MaW5lSW5kZXgsXHJcbiAgICAgICAgICBjYW5kaWRhdGU6IGV2ZW50LmNhbmRpZGF0ZS5jYW5kaWRhdGVcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBOb3RlOiBzZWVtcyBsaWtlIGNoYW5uZWwub25jbG9zZSBoYW5kZXIgaXMgdW5yZWxpYWJsZSBvbiBzb21lIHBsYXRmb3JtcyxcclxuICAgIC8vICAgICAgIHNvIGFsc28gdHJpZXMgdG8gZGV0ZWN0IGRpc2Nvbm5lY3Rpb24gaGVyZS5cclxuICAgIHBjLm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwib25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2VcIik7XHJcbiAgICAgIGlmIChzZWxmLm9wZW4gJiYgcGMuaWNlQ29ubmVjdGlvblN0YXRlID09PSBcImRpc2Nvbm5lY3RlZFwiKSB7XHJcbiAgICAgICAgc2VsZi5vcGVuID0gZmFsc2U7XHJcbiAgICAgICAgc2VsZi5jbG9zZWRMaXN0ZW5lcihzZWxmLnJlbW90ZUlkKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gcGM7XHJcbiAgfVxyXG5cclxuICBzZXR1cENoYW5uZWwoY2hhbm5lbCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuY2hhbm5lbCA9IGNoYW5uZWw7XHJcblxyXG4gICAgLy8gcmVjZWl2ZWQgZGF0YSBmcm9tIGEgcmVtb3RlIHBlZXJcclxuICAgIHRoaXMuY2hhbm5lbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcInJlY2VpdmVkIGRhdGEgZnJvbSByZW1vdGUgcGVlclwiKTtcclxuICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xyXG4gICAgICBzZWxmLm1lc3NhZ2VMaXN0ZW5lcihzZWxmLnJlbW90ZUlkLCBkYXRhLnR5cGUsIGRhdGEuZGF0YSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGNvbm5lY3RlZCB3aXRoIGEgcmVtb3RlIHBlZXJcclxuICAgIHRoaXMuY2hhbm5lbC5vbm9wZW4gPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcImNvbm5lY3RlZCB0byBhIHJlbW90ZSBwZWVyXCIpO1xyXG4gICAgICBzZWxmLm9wZW4gPSB0cnVlO1xyXG4gICAgICBzZWxmLm9wZW5MaXN0ZW5lcihzZWxmLnJlbW90ZUlkKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gZGlzY29ubmVjdGVkIHdpdGggYSByZW1vdGUgcGVlclxyXG4gICAgdGhpcy5jaGFubmVsLm9uY2xvc2UgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcImRpc2NubmVjdGVkIHRvIGEgcmVtb3RlIHBlZXJcIik7XHJcbiAgICAgIGlmICghc2VsZi5vcGVuKSByZXR1cm47XHJcbiAgICAgIHNlbGYub3BlbiA9IGZhbHNlO1xyXG4gICAgICBzZWxmLmNsb3NlZExpc3RlbmVyKHNlbGYucmVtb3RlSWQpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBlcnJvciBvY2N1cnJlZCB3aXRoIGEgcmVtb3RlIHBlZXJcclxuICAgIHRoaXMuY2hhbm5lbC5vbmVycm9yID0gZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIldlYlJ0Y1BlZXIuY2hhbm5lbC5vbmVycm9yOiBcIiArIGVycm9yKTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBoYW5kbGVPZmZlcihtZXNzYWdlKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcImhhbmRsZU9mZmVyXCIpO1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMucGMub25kYXRhY2hhbm5lbCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIHNlbGYuc2V0dXBDaGFubmVsKGV2ZW50LmNoYW5uZWwpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldFJlbW90ZURlc2NyaXB0aW9uKG1lc3NhZ2UpO1xyXG5cclxuICAgIHRoaXMucGMuY3JlYXRlQW5zd2VyKFxyXG4gICAgICBmdW5jdGlvbihzZHApIHtcclxuICAgICAgICBzZWxmLmhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbihzZHApO1xyXG4gICAgICB9LFxyXG4gICAgICBmdW5jdGlvbihlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJXZWJSdGNQZWVyLmhhbmRsZU9mZmVyOiBcIiArIGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGhhbmRsZUFuc3dlcihtZXNzYWdlKSB7XHJcbiAgICB0aGlzLnNldFJlbW90ZURlc2NyaXB0aW9uKG1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcbiAgaGFuZGxlQ2FuZGlkYXRlKG1lc3NhZ2UpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBSVENJY2VDYW5kaWRhdGUgPVxyXG4gICAgICB3aW5kb3cuUlRDSWNlQ2FuZGlkYXRlIHx8XHJcbiAgICAgIHdpbmRvdy53ZWJraXRSVENJY2VDYW5kaWRhdGUgfHxcclxuICAgICAgd2luZG93Lm1velJUQ0ljZUNhbmRpZGF0ZTtcclxuXHJcbiAgICB0aGlzLnBjLmFkZEljZUNhbmRpZGF0ZShcclxuICAgICAgbmV3IFJUQ0ljZUNhbmRpZGF0ZShtZXNzYWdlKSxcclxuICAgICAgZnVuY3Rpb24oKSB7fSxcclxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiV2ViUnRjUGVlci5oYW5kbGVDYW5kaWRhdGU6IFwiICsgZXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uKHNkcCkge1xyXG4gICAgY29uc29sZS5sb2coXCJoYW5kbGVTZXNzaW9uRGVzY3JpcHRpb25cIiwgc2RwKTtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB0aGlzLnBjLnNldExvY2FsRGVzY3JpcHRpb24oXHJcbiAgICAgIHNkcCxcclxuICAgICAgZnVuY3Rpb24oKSB7fSxcclxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiV2ViUnRjUGVlci5oYW5kbGVTZXNzaW9uRGVzY3JpcHRpb246IFwiICsgZXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuc2VuZFNpZ25hbEZ1bmMoe1xyXG4gICAgICBmcm9tOiB0aGlzLmxvY2FsSWQsXHJcbiAgICAgIHRvOiB0aGlzLnJlbW90ZUlkLFxyXG4gICAgICB0eXBlOiBzZHAudHlwZSxcclxuICAgICAgc2RwOiBzZHAuc2RwXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNldFJlbW90ZURlc2NyaXB0aW9uKG1lc3NhZ2UpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBSVENTZXNzaW9uRGVzY3JpcHRpb24gPVxyXG4gICAgICB3aW5kb3cuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XHJcbiAgICAgIHdpbmRvdy53ZWJraXRSVENTZXNzaW9uRGVzY3JpcHRpb24gfHxcclxuICAgICAgd2luZG93Lm1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxyXG4gICAgICB3aW5kb3cubXNSVENTZXNzaW9uRGVzY3JpcHRpb247XHJcblxyXG4gICAgdGhpcy5wYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihcclxuICAgICAgbmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihtZXNzYWdlKSxcclxuICAgICAgZnVuY3Rpb24oKSB7fSxcclxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiV2ViUnRjUGVlci5zZXRSZW1vdGVEZXNjcmlwdGlvbjogXCIgKyBlcnJvcik7XHJcbiAgICAgIH1cclxuICAgICk7XHJcbiAgfVxyXG59XHJcblxyXG5XZWJSdGNQZWVyLklTX0NPTk5FQ1RFRCA9IFwiSVNfQ09OTkVDVEVEXCI7XHJcbldlYlJ0Y1BlZXIuQ09OTkVDVElORyA9IFwiQ09OTkVDVElOR1wiO1xyXG5XZWJSdGNQZWVyLk5PVF9DT05ORUNURUQgPSBcIk5PVF9DT05ORUNURURcIjtcclxuXHJcbldlYlJ0Y1BlZXIuSUNFX1NFUlZFUlMgPSBbXHJcbiAgeyB1cmxzOiBcInN0dW46c3R1bi5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxyXG4gIHsgdXJsczogXCJzdHVuOnN0dW4xLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sXHJcbiAgeyB1cmxzOiBcInN0dW46c3R1bjIubC5nb29nbGUuY29tOjE5MzAyXCIgfSxcclxuICB7IHVybHM6IFwic3R1bjpzdHVuMy5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxyXG4gIHsgdXJsczogXCJzdHVuOnN0dW40LmwuZ29vZ2xlLmNvbToxOTMwMlwiIH1cclxuXTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2ViUnRjUGVlcjtcclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL1dlYlJ0Y1BlZXIuanMiXSwic291cmNlUm9vdCI6IiJ9