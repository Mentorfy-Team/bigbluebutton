import Screenshare from '/imports/api/screenshare';
import KurentoBridge from '/imports/api/screenshare/client/bridge';
import BridgeService from '/imports/api/screenshare/client/bridge/service';
import Settings from '/imports/ui/services/settings';
import logger from '/imports/startup/client/logger';
import { tryGenerateIceCandidates } from '/imports/utils/safari-webrtc';
import { stopWatching } from '/imports/ui/components/external-video-player/service';
import Meetings from '/imports/api/meetings';
import Auth from '/imports/ui/services/auth';
import UserListService from '/imports/ui/components/user-list/service';
import AudioService from '/imports/ui/components/audio/service';
import {Meteor} from "meteor/meteor";

const SCREENSHARE_MEDIA_ELEMENT_NAME = 'screenshareVideo';

let _isSharingScreen = false;
const _sharingScreenDep = {
  value: false,
  tracker: new Tracker.Dependency(),
};

const isSharingScreen = () => {
  _sharingScreenDep.tracker.depend();
  return _sharingScreenDep.value;
};

const setSharingScreen = (isSharingScreen) => {
  if (_sharingScreenDep.value !== isSharingScreen) {
    _sharingScreenDep.value = isSharingScreen;
    _sharingScreenDep.tracker.changed();
  }
};

// A simplified, trackable version of isVideoBroadcasting that DOES NOT
// account for the presenter's local sharing state.
// It reflects the GLOBAL screen sharing state (akka-apps)
const isGloballyBroadcasting = () => {
  const screenshareEntry = Screenshare.findOne({ meetingId: Auth.meetingID },
    { fields: { 'screenshare.stream': 1 } });

  return (!screenshareEntry ? false : !!screenshareEntry.screenshare.stream);
}

// when the meeting information has been updated check to see if it was
// screensharing. If it has changed either trigger a call to receive video
// and display it, or end the call and hide the video
const isVideoBroadcasting = () => {
  const sharing = isSharingScreen();
  const screenshareEntry = Screenshare.findOne({ meetingId: Auth.meetingID },
    { fields: { 'screenshare.stream': 1 } });
  const screenIsShared = !screenshareEntry ? false : !!screenshareEntry.screenshare.stream;

  if (screenIsShared && isSharingScreen) {
    setSharingScreen(false);
  }

  return sharing || screenIsShared;
};


const screenshareHasAudio = () => {
  const screenshareEntry = Screenshare.findOne({ meetingId: Auth.meetingID },
    { fields: { 'screenshare.hasAudio': 1 } });

  if (!screenshareEntry) {
    return false;
  }

  return !!screenshareEntry.screenshare.hasAudio;
}

const screenshareHasEnded = () => {
  if (isSharingScreen()) {
    setSharingScreen(false);
  }

  KurentoBridge.stop();
};

const getMediaElement = () => {
  return document.getElementById(SCREENSHARE_MEDIA_ELEMENT_NAME);
}

const attachLocalPreviewStream = (mediaElement) => {
  const stream = KurentoBridge.gdmStream;
  if (stream && mediaElement) {
    // Always muted, presenter preview.
    BridgeService.screenshareLoadAndPlayMediaStream(stream, mediaElement, true);
  }
}

const screenshareHasStarted = () => {
  // Presenter's screen preview is local, so skip
  if (!UserListService.amIPresenter()) {
    viewScreenshare();
  }
};

const shareScreen = async (onFail) => {
  // stop external video share if running
  const meeting = Meetings.findOne({ meetingId: Auth.meetingID });

  if (meeting && meeting.externalVideoUrl) {
    stopWatching();
  }

  try {
    const stream = await BridgeService.getScreenStream();
    await KurentoBridge.share(stream, onFail);
    setSharingScreen(true);
  } catch (error) {
    return onFail(error);
  }
};

const viewScreenshare = () => {
  const hasAudio = screenshareHasAudio();
  KurentoBridge.view(hasAudio).catch((error) => {
    logger.error({
      logCode: 'screenshare_view_failed',
      extraInfo: {
        errorName: error.name,
        errorMessage: error.message,
      },
    }, `Screenshare viewer failure`);
  });
};

const screenShareEndAlert = () => AudioService
  .playAlertSound(`${Meteor.settings.public.app.cdn
    + Meteor.settings.public.app.basename
    + Meteor.settings.public.app.instanceId}`
    + '/resources/sounds/ScreenshareOff.mp3');

const dataSavingSetting = () => Settings.dataSaving.viewScreenshare;

export {
  SCREENSHARE_MEDIA_ELEMENT_NAME,
  isVideoBroadcasting,
  screenshareHasEnded,
  screenshareHasStarted,
  shareScreen,
  screenShareEndAlert,
  dataSavingSetting,
  isSharingScreen,
  setSharingScreen,
  getMediaElement,
  attachLocalPreviewStream,
  isGloballyBroadcasting,
};
