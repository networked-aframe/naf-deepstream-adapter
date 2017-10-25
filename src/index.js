var WebRtcPeer = require("./WebRtcPeer");

class DeepstreamWebRtcAdapter {
  /**
      Config structure:
      config.url: 'YOUR_URL_HERE'
    */
  constructor(ds, config) {
    this.rootPath = "networked-aframe";

    this.localId = null;
    this.appId = null;
    this.roomId = null;

    this.peers = {}; // id -> WebRtcPeer
    this.occupants = {}; // id -> joinTimestamp

    config = config || window.deepstreamConfig;
    this.ds = ds || window.deepstream;

    if (this.ds === undefined) {
      throw new Error(
        "Import https://cdnjs.cloudflare.com/ajax/libs/deepstream.io-client-js/x.x.x/deepstream.js"
      );
    }

    this.dsUrl = config.url;
  }

  /*
   * Call before `connect`
   */

  setServerUrl(url) {
    // handled in config
  }

  setApp(appId) {
    this.appId = appId;
  }

  setRoom(roomId) {
    this.roomId = roomId;
  }

  // options: { datachannel: bool, audio: bool }
  setWebRtcOptions(options) {
    // TODO: support audio and video
    if (options.datachannel === false)
      console.warn(
        "DeepstreamWebRtcAdapter.setWebRtcOptions: datachannel must be true."
      );
    if (options.audio === true)
      console.warn("DeepstreamWebRtcAdapter does not support audio yet.");
    if (options.video === true)
      console.warn("DeepstreamWebRtcAdapter does not support video yet.");
  }

  setServerConnectListeners(successListener, failureListener) {
    this.connectSuccess = successListener;
    this.connectFailure = failureListener;
  }

  setRoomOccupantListener(occupantListener) {
    this.occupantListener = occupantListener;
  }

  setDataChannelListeners(openListener, closedListener, messageListener) {
    this.openListener = openListener;
    this.closedListener = closedListener;
    this.messageListener = messageListener;
  }

  connect() {
    var self = this;
    var ds = this.ds;

    var dsClient = this.ds(this.dsUrl);
    this.dsClient = dsClient;

    dsClient.login({}, function(success, data) {
      if (success) {
        self.startApp(data.id);
      } else {
        // TODO failure messages
        self.connectFailure();
      }
    });

    dsClient.presence.getAll(function(ids) {
      // ids.forEach(subscribeToAvatarChanges)
      console.log("existing clients", ids);
      for (var i = 0; i < ids.length; i++) {
        self.clientConnected(ids[i]);
      }
    });

    dsClient.presence.subscribe((clientId, isOnline) => {
      console.log("client presence id", clientId, "online?", isOnline);
      if (isOnline) {
        self.clientConnected(clientId);
      } else {
        self.clientDisconnected(clientId);
      }
    });
  }

  shouldStartConnectionTo(client) {
    return (this.myRoomJoinTime || 0) <= (client ? client.roomJoinTime : 0);
  }

  startStreamConnection(clientId) {
    // Handled by WebRtcPeer
  }

  closeStreamConnection(clientId) {
    // Handled by WebRtcPeer
  }

  sendData(clientId, dataType, data) {
    this.peers[clientId].send(dataType, data);
  }

  sendDataGuaranteed(clientId, dataType, data) {
    var clonedData = JSON.parse(JSON.stringify(data));
    this.dsClient.record.getRecord(this.getUserPath(this.localId)).set("data", {
      to: clientId,
      type: dataType,
      data: clonedData
    });
  }

  broadcastData(dataType, data) {
    for (var clientId in this.peers) {
      if (this.peers.hasOwnProperty(clientId)) {
        this.sendData(clientId, dataType, data);
      }
    }
  }

  broadcastDataGuaranteed(dataType, data) {
    for (var clientId in this.peers) {
      if (this.peers.hasOwnProperty(clientId)) {
        this.sendDataGuaranteed(clientId, dataType, data);
      }
    }
  }

  getConnectStatus(clientId) {
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

  startApp(clientId) {
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

  clientConnected(clientId) {
    console.log("new client", clientId);
    var self = this;
    var dsClient = this.dsClient;

    if (!NAF.connection.isConnected()) {
      console.warn(
        "Trying to make a connection to another client before my client has connected"
      );
    }

    dsClient.record
      .getRecord(this.getUserPath(clientId))
      .whenReady(function(clientRecord) {
        var onClientSetup = function(timestamp) {
          // if (remoteId === self.localId || remoteId === 'timestamp' || self.peers[remoteId] !== undefined) return;

          var remoteTimestamp = clientRecord.get("timestamp");
          console.log("remote timestamp", remoteTimestamp);

          var peer = new WebRtcPeer(
            self.localId,
            clientId,
            // send signal function
            function(data) {
              console.log("setting signal", data);
              dsClient.record
                .getRecord(self.getUserPath(self.localId))
                .set("signal", data);
            }
          );
          peer.setDatachannelListeners(
            self.openListener,
            self.closedListener,
            self.messageListener
          );

          self.peers[clientId] = peer;
          self.occupants[clientId] = remoteTimestamp;

          // received signal
          clientRecord.subscribe("signal", function(data) {
            console.log("received signal", data);
            var value = data;
            if (value === null || value === "") return;
            peer.handleSignal(value);
          });

          // received data
          clientRecord.subscribe("data", function(data) {
            console.log("received data", data);
            var value = data;
            if (value === null || value === "" || value.to !== self.localId)
              return;
            self.messageListener(clientId, value.type, value.data);
          });

          // send offer from a peer who
          //   - later joined the room, or
          //   - has larger id if two peers joined the room at same time
          console.log(
            "checking to see who should send offer",
            self.localTimestamp > remoteTimestamp,
            self.localTimestamp === remoteTimestamp && self.localId > clientId
          );
          if (
            self.localTimestamp > remoteTimestamp ||
            (self.localTimestamp === remoteTimestamp && self.localId > clientId)
          ) {
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

  clientDisconnected() {
    // TODO
  }

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

  getRootPath() {
    return this.rootPath;
  }

  getAppPath() {
    return this.getRootPath() + "/" + this.appId;
  }

  getRoomPath() {
    return this.getAppPath() + "/" + this.roomId;
  }

  getUserPath(id) {
    return this.getRoomPath() + "/" + id;
  }

  getSignalPath(id) {
    return this.getUserPath(id) + "/signal";
  }

  getDataPath(id) {
    return this.getUserPath(id) + "/data";
  }

  getTimestampGenerationPath(id) {
    return this.getRoomPath() + "/timestamp/" + id;
  }
}

NAF.adapters.register("deepstream", DeepstreamWebRtcAdapter);

module.exports = DeepstreamWebRtcAdapter;
