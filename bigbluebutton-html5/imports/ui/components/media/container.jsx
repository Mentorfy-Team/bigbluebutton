import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import Settings from '/imports/ui/services/settings';
import { defineMessages, injectIntl } from 'react-intl';
import { notify } from '/imports/ui/services/notification';
import VideoService from '/imports/ui/components/video-provider/service';
import getFromUserSettings from '/imports/ui/services/users-settings';
import Media from './component';
import MediaService, { getSwapLayout } from './service';
import PresentationPodsContainer from '../presentation-pod/container';
import ScreenshareContainer from '../screenshare/container';
import DefaultContent from '../presentation/default-content/component';

const LAYOUT_CONFIG = Meteor.settings.public.layout;
const KURENTO_CONFIG = Meteor.settings.public.kurento;

const intlMessages = defineMessages({
  screenshareStarted: {
    id: 'app.media.screenshare.start',
    description: 'toast to show when a screenshare has started',
  },
  screenshareEnded: {
    id: 'app.media.screenshare.end',
    description: 'toast to show when a screenshare has ended',
  },
  screenshareSafariNotSupportedError: {
    id: 'app.media.screenshare.safariNotSupported',
    description: 'Error message for screenshare not supported on Safari',
  },
  chromeExtensionError: {
    id: 'app.video.chromeExtensionError',
    description: 'Error message for Chrome Extension not installed',
  },
  chromeExtensionErrorLink: {
    id: 'app.video.chromeExtensionErrorLink',
    description: 'Error message for Chrome Extension not installed',
  },
});

class MediaContainer extends Component {
  componentWillMount() {
    const { willMount } = this.props;
    willMount && willMount();
    document.addEventListener('installChromeExtension', this.installChromeExtension.bind(this));
    document.addEventListener('safariScreenshareNotSupported', this.safariScreenshareNotSupported.bind(this));
  }

  componentWillUnmount() {
    document.removeEventListener('installChromeExtension', this.installChromeExtension.bind(this));
    document.removeEventListener('safariScreenshareNotSupported', this.safariScreenshareNotSupported.bind(this));
  }

  componentWillReceiveProps(nextProps) {
    const {
      isScreensharing,
      intl,
    } = this.props;

    if (isScreensharing !== nextProps.isScreensharing) {
      if (nextProps.isScreensharing) {
        notify(intl.formatMessage(intlMessages.screenshareStarted), 'info', 'desktop');
      } else {
        notify(intl.formatMessage(intlMessages.screenshareEnded), 'info', 'desktop');
      }
    }
  }

  installChromeExtension() {
    const { intl } = this.props;

    const CHROME_DEFAULT_EXTENSION_LINK = KURENTO_CONFIG.chromeDefaultExtensionLink;
    const CHROME_CUSTOM_EXTENSION_LINK = KURENTO_CONFIG.chromeExtensionLink;
    const CHROME_EXTENSION_LINK = CHROME_CUSTOM_EXTENSION_LINK === 'LINK' ? CHROME_DEFAULT_EXTENSION_LINK : CHROME_CUSTOM_EXTENSION_LINK;

    notify(<div>
      {intl.formatMessage(intlMessages.chromeExtensionError)}{' '}
      <a href={CHROME_EXTENSION_LINK} target="_blank">
        {intl.formatMessage(intlMessages.chromeExtensionErrorLink)}
      </a>
    </div>, 'error', 'desktop');
  }

  safariScreenshareNotSupported() {
    const { intl } = this.props;
    notify(intl.formatMessage(intlMessages.screenshareSafariNotSupportedError), 'error', 'desktop');
  }

  render() {
    return <Media {...this.props} />;
  }
}

export default withTracker(() => {
  const { dataSaving } = Settings;
  const { viewParticipantsWebcams, viewScreenshare } = dataSaving;

  const hidePresentation = getFromUserSettings('hidePresentation', LAYOUT_CONFIG.hidePresentation);
  const data = {
    children: <DefaultContent />,
  };

  if (MediaService.shouldShowWhiteboard() && !hidePresentation) {
    data.currentPresentation = MediaService.getPresentationInfo();
    data.children = <PresentationPodsContainer />;
  }

  if (MediaService.shouldShowScreenshare() && (viewScreenshare || MediaService.isUserPresenter())) {
    data.children = <ScreenshareContainer />;
  }

  const usersVideo = VideoService.getAllUsersVideo();
  if (MediaService.shouldShowOverlay() && usersVideo.length) {
    data.floatingOverlay = usersVideo.length < 2;
    data.hideOverlay = usersVideo.length === 0;
  }

  data.isScreensharing = MediaService.isVideoBroadcasting();
  data.swapLayout = getSwapLayout();
  data.disableVideo = !viewParticipantsWebcams;

  if (data.swapLayout) {
    data.floatingOverlay = true;
    data.hideOverlay = hidePresentation;
  }

  const enableVideo = getFromUserSettings('enableVideo', KURENTO_CONFIG.enableVideo);
  const autoShareWebcam = getFromUserSettings('autoShareWebcam', KURENTO_CONFIG.autoShareWebcam);

  if (enableVideo && autoShareWebcam) {
    data.willMount = VideoService.joinVideo;
  }

  return data;
})(injectIntl(MediaContainer));
