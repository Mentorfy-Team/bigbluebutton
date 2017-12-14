import React, { Component } from 'react';
import ScreenshareContainer from '/imports/ui/components/screenshare/container';
import styles from './styles';
import { log } from '/imports/ui/services/api';


window.addEventListener('resize', () => {
  window.adjustVideos('webcamArea', true);
});

class VideoElement extends Component {
  constructor(props) {
    super(props);
  }
}

export default class VideoDock extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // Set a valid kurento application server socket in the settings
      ws: new ReconnectingWebSocket(Meteor.settings.public.kurento.wsUrl),
      webRtcPeers: {},
      wsQueue: [],
      reconnectWebcam: false,
      reconnectList: [],
      sharedCameraTimeout: null,
      subscribedCamerasTimeouts: [],
      videos: {},
    };

    window.ws = this.state.ws;

    this.state.ws.addEventListener('open', () => {
      log('debug', '------ Websocket connection opened.');

      // -- Resend queued messages that happened when socket was not connected
      while (this.state.wsQueue.length > 0) {
        this.sendMessage(this.state.wsQueue.pop());
      }

      this.reconnectVideos();
    });

    this.state.ws.addEventListener('close', (error) => {
      log('debug', '------ Websocket connection closed.');

      this.setupReconnectVideos();
    });

    this.sendUserShareWebcam = props.sendUserShareWebcam.bind(this);
    this.sendUserUnshareWebcam = props.sendUserUnshareWebcam.bind(this);

    this.unshareWebcam = this.unshareWebcam.bind(this);
    this.shareWebcam = this.shareWebcam.bind(this);
  }

  setupReconnectVideos() {
    for (id in this.state.webRtcPeers) {
      this.disconnected(id);
      this.stop(id);
    }
  }

  reconnectVideos() {
    for (i in this.state.reconnectList) {
      const id = this.state.reconnectList[i];

      // TODO: base this on BBB API users instead of using memory
      if (id != this.state.myId) {
        setTimeout(() => {
          log('debug', ` [camera] Trying to reconnect camera ${id}`);
          this.start(id, false, this.refs.videoInput);
        }, 5000);
      }
    }

    if (this.state.reconnectWebcam) {
      log('debug', ` [camera] Trying to re-share ${this.state.myId} after reconnect.`);
      this.start(this.state.myId, true, this.refs.videoInput);
    }

    this.setState({ reconnectWebcam: false, reconnectList: [] });
  }

  componentDidMount() {
    const that = this;
    const ws = this.state.ws;
    const { users } = this.props;
    for (let i = 0; i < users.length; i++) {
      if (users[i].has_stream) {
        this.start(users[i].userId, false, this.refs.videoInput);
      }
    }

    document.addEventListener('joinVideo', () => { that.shareWebcam(); });// TODO find a better way to do this
    document.addEventListener('exitVideo', () => { that.unshareWebcam(); });

    ws.addEventListener('message', (msg) => {
      const parsedMessage = JSON.parse(msg.data);

      console.log('Received message new ws message: ');
      console.log(parsedMessage);

      switch (parsedMessage.id) {
        case 'startResponse':
          this.startResponse(parsedMessage);
          break;

        case 'error':
          this.handleError(parsedMessage);
          break;

        case 'playStart':
          this.handlePlayStart(parsedMessage);
          break;

        case 'playStop':
          this.handlePlayStop(parsedMessage);

          break;

        case 'iceCandidate':

          const webRtcPeer = this.state.webRtcPeers[parsedMessage.cameraId];

          if (webRtcPeer !== null) {
            if (webRtcPeer.didSDPAnswered) {
              webRtcPeer.addIceCandidate(parsedMessage.candidate, (err) => {
                if (err) {
                  return log('error', `Error adding candidate: ${err}`);
                }
              });
            } else {

              // If we are ever in a position where iceQueue is not defined by this point
              if (typeof webRtcPeer.iceQueue === 'undefined') {
                webRtcPeer.iceQueue = [];
              }

              webRtcPeer.iceQueue.push(parsedMessage.candidate);
            }
          } else {
            log('error', ' [ICE] Message arrived before webRtcPeer?');
          }

          break;
      }
    });
  }

  start(id, shareWebcam, videoInput) {
    const that = this;

    const ws = this.state.ws;

    console.log(`Starting video call for video: ${id}`);
    log('info', 'Creating WebRtcPeer and generating local sdp offer ...');

    const onIceCandidate = function (candidate) {
      const message = {
        type: 'video',
        role: shareWebcam ? 'share' : 'viewer',
        id: 'onIceCandidate',
        candidate,
        cameraId: id,
      };
      that.sendMessage(message);
    };

    var videoConstraints = {};
    if (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) { // Custom constraints for Safari
      videoConstraints = {
        width: {min:320, max:640},
        height: {min:240, max:480}
      }
    } else {
      videoConstraints = {
        width: {min: 320, ideal: 320},
        height: {min: 240, ideal:240},
        frameRate: {min: 5, ideal: 10}
      };
    }

    const options = {
      mediaConstraints: {
        audio: false,
        video: videoConstraints
      },
      onicecandidate: onIceCandidate,
    };

    let peerObj;
    if (shareWebcam) {
      options.localVideo = videoInput;
      peerObj = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly;
    } else {
      peerObj = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly;

      options.remoteVideo = this.createVideoTag(id);
      document.getElementById('webcamArea').appendChild(options.remoteVideo);
    }

    this.state.webRtcPeers[id] = new peerObj(options, function (error) {
      if (error) {
        log('error', ' WebRTC peerObj create error');

        that.destroyWebRTCPeer(id);
        that.destroyVideoTag(id);

        return log('error', error);
      }

      this.didSDPAnswered = false;
      this.iceQueue = [];

      if (shareWebcam) {
        that.state.sharedWebcam = that.state.webRtcPeers[id];
        that.state.myId = id;
      }

      this.generateOffer((error, offerSdp) => {
        if (error) {
          log('error', ' WebRtc generate offer error');

          that.destroyWebRTCPeer(id);
          that.destroyVideoTag(id);

          return log('error', error);
        }

        console.log(`Invoking SDP offer callback function ${location.host}`);
        const message = {
          type: 'video',
          role: shareWebcam ? 'share' : 'viewer',
          id: 'start',
          sdpOffer: offerSdp,
          cameraId: id,
          cameraShared: shareWebcam,
        };
        that.sendMessage(message);
      });
      while (this.iceQueue.length) {
        var candidate = this.iceQueue.shift();
        this.addIceCandidate(candidate, (err) => {
          if (err) {
            return console.error(`Error adding candidate: ${err}`);
          }
        });
      }
      this.didSDPAnswered = true;
    });
  }

  disconnected(id) {
    if (this.state.sharedWebcam) {
      log('debug', ' [camera] Webcam disconnected, will try re-share webcam later.');
      this.setState({ reconnectWebcam: true });
    } else {
      const reconnectList = this.state.reconnectList;

      reconnectList.push(id);

      log('debug', ` [camera] ${id} disconnected, will try re-subscribe later.`);

      this.setState({ reconnectList });
    }
  }

  stop(id) {
    const { users } = this.props;
    if (id == users[0].userId) {
      this.unshareWebcam();
    }

    this.destroyWebRTCPeer(id);
    this.destroyVideoTag(id);

    this.sendMessage({
      type: 'video',
      role: 'any',
      id: 'stop',
      cameraId: id,
    });

    window.adjustVideos('webcamArea', true);
  }

  createVideoTag(id) {
    let remoteVideo = {};
    remoteVideo = document.createElement('video');
    remoteVideo.id = `video-elem-${id}`;
    remoteVideo.width = 320;
    remoteVideo.height = 240;
    remoteVideo.autoplay = true;
    remoteVideo.playsinline = true;

    document.getElementById('webcamArea').appendChild(remoteVideo);

    return remoteVideo;
  }

  destroyVideoTag(id) {
    const videoTag = document.getElementById(`video-elem-${id}`);
    if (videoTag) {
      document.getElementById('webcamArea').removeChild(videoTag);
    }
  }

  destroyWebRTCPeer(id) {
    const webRtcPeer = this.state.webRtcPeers[id];

    if (webRtcPeer) {
      log('info', 'Stopping WebRTC peer');

      webRtcPeer.dispose();
      delete this.state.webRtcPeers[id];
    } else {
      log('info', 'No WebRTC peer to stop (not an error)');
    }

    if (this.state.sharedWebcam) {
      this.state.sharedWebcam.dispose();
      this.state.sharedWebcam = null;
    } else {
      log('info', 'No shared camera WebRTC peer to stop (not an error)');
    }
  }

  shareWebcam() {
    const { users } = this.props;
    const id = users[0].userId;

    if (this.connectedToMediaServer()) {
      this.start(id, true, this.refs.videoInput);
    } else {
      log("error", "Not connected to media server BRA");
    }

  }

  unshareWebcam() {
    log('info', 'Unsharing webcam');
    const { users } = this.props;
    const id = users[0].userId;
    this.sendUserUnshareWebcam(id);
  }

  startResponse(message) {
    const id = message.cameraId;
    const webRtcPeer = this.state.webRtcPeers[id];

    if (message.sdpAnswer == null) {
      return log('debug', 'Null sdp answer. Camera unplugged?');
    }

    if (webRtcPeer == null) {
      return log('debug', 'Null webrtc peer ????');
    }

    log('info', 'SDP answer received from server. Processing ...');

    webRtcPeer.processAnswer(message.sdpAnswer, (error) => {
      if (error) {
        return log('error', error);
      }
    });

    this.sendUserShareWebcam(id);
  }

  sendMessage(message) {
    const ws = this.state.ws;

    if (this.connectedToMediaServer()) {
      const jsonMessage = JSON.stringify(message);
      console.log(`Sending message: ${jsonMessage}`);
      ws.send(jsonMessage, (error) => {
        if (error) {
          console.error(`client: Websocket error "${error}" on message "${jsonMessage.id}"`);
        }
      });
    } else {
      // No need to queue video stop messages
      if (message.id != 'stop') {
        this.state.wsQueue.push(message);
      }
    }
  }

  connectedToMediaServer() {
    return ws.readyState == WebSocket.OPEN;
  }

  connectionStatus() {
    return ws.readyState;
  }

  handlePlayStop(message) {
    log('info', 'Handle play stop <--------------------');
    log('error', message);

    this.stop(message.cameraId);
  }

  handlePlayStart(message) {
    log('info', 'Handle play start <===================');

    window.adjustVideos('webcamArea', true);
  }

  handleError(message) {
    console.error(' Handle error --------------------->');
    log('debug', message.message);
  }

  render() {
    return (

      <div className={styles.videoDock}>
        <div id="webcamArea" />
        <video id="shareWebcamVideo" className={styles.sharedWebcamVideo} ref="videoInput" />
      </div>
    );
  }

  componentWillUnmount() {
    // Close websocket connection to prevent multiple reconnects from happening
    this.state.ws.close();

    this.state.ws.removeEventListener('message', () => {});
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { users } = this.props;
    const nextUsers = nextProps.users;

    if (users) {
      let suc = false;

      for (let i = 0; i < users.length; i++) {
        if (users && users[i] &&
              nextUsers && nextUsers[i]) {
          if (users[i].has_stream !== nextUsers[i].has_stream) {
            console.log(`User ${nextUsers[i].has_stream ? '' : 'un'}shared webcam ${users[i].userId}`);

            if (nextUsers[i].has_stream) {
              this.start(users[i].userId, false, this.refs.videoInput);
            } else {
              this.stop(users[i].userId);
            }

            if (!nextUsers[i].has_stream) {
              console.log(" DESTROYING ----------------------- " + users[i].userId);
              this.destroyVideoTag(users[i].userId);
            }

            suc = suc || true;
          }
        }
      }

      return true;
    }

    return false;
  }
}
