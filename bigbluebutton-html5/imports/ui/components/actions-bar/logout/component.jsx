import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { withModalMounter } from '/imports/ui/components/common/modal/service';
import { makeCall } from '/imports/ui/services/api';
import Button from '/imports/ui/components/common/button/component';

const propTypes = {
  intl: PropTypes.objectOf(Object).isRequired,
  amIPresenter: PropTypes.bool.isRequired,
};

const intlMessages = defineMessages({
  desktopShareLabel: {
    id: 'app.actionsBar.actionsDropdown.desktopShareLabel',
    description: 'Desktop Share option label',
  },
  stopDesktopShareLabel: {
    id: 'app.actionsBar.actionsDropdown.stopDesktopShareLabel',
    description: 'Stop Desktop Share option label',
  },
  desktopShareDesc: {
    id: 'app.actionsBar.actionsDropdown.desktopShareDesc',
    description: 'adds context to desktop share option',
  },
  stopDesktopShareDesc: {
    id: 'app.actionsBar.actionsDropdown.stopDesktopShareDesc',
    description: 'adds context to stop desktop share option',
  },
  screenShareNotSupported: {
    id: 'app.media.screenshare.notSupported',
    descriptions: 'error message when trying share screen on unsupported browsers',
  },
  screenShareUnavailable: {
    id: 'app.media.screenshare.unavailable',
    descriptions: 'title for unavailable screen share modal',
  },
  finalError: {
    id: 'app.screenshare.screenshareFinalError',
    description: 'Screen sharing failures with no recovery procedure',
  },
  retryError: {
    id: 'app.screenshare.screenshareRetryError',
    description: 'Screen sharing failures where a retry is recommended',
  },
  retryOtherEnvError: {
    id: 'app.screenshare.screenshareRetryOtherEnvError',
    description: 'Screen sharing failures where a retry in another environment is recommended',
  },
  unsupportedEnvError: {
    id: 'app.screenshare.screenshareUnsupportedEnv',
    description: 'Screen sharing is not supported, changing browser or device is recommended',
  },
  permissionError: {
    id: 'app.screenshare.screensharePermissionError',
    description: 'Screen sharing failure due to lack of permission',
  },
  leaveSessionLabel: {
    id: 'app.navBar.settingsDropdown.leaveSessionLabel',
    description: 'Leave session button label',
  },
  leaveSessionDesc: {
    id: 'app.navBar.settingsDropdown.leaveSessionDesc',
    description: 'Describes leave session option',
  },
});

const LogoutButton = ({
  intl,
}) => {
  const dataTest = 'logout';

  return (<Button
    icon='logout'
    data-test={dataTest}
    label={intl.formatMessage(intlMessages.leaveSessionLabel)}
    description={intl.formatMessage(intlMessages.leaveSessionDesc)}
    color={'danger'}
    hideLabel
    circle
    size="lg"
    onClick={() => {
      makeCall('userLeftMeeting');
      // we don't check askForFeedbackOnLogout here,
      // it is checked in meeting-ended component
      window.close();
      Session.set('codeError', this.LOGOUT_CODE);
    }}
    id={'logout-main'}
  />);
};

LogoutButton.propTypes = propTypes;
export default withModalMounter(injectIntl(memo(LogoutButton)));

