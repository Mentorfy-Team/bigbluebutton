import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, intlShape, injectIntl } from 'react-intl';
import Button from '/imports/ui/components/button/component';
import { styles } from './styles';
import cx from 'classnames';

const intlMessages = defineMessages({
  joinAudio: {
    id: 'app.audio.joinAudio',
    description: 'Join audio button label',
  },
  leaveAudio: {
    id: 'app.audio.leaveAudio',
    description: 'Leave audio button label',
  },
  muteAudio: {
    id: 'app.actionsBar.muteLabel',
    description: 'Mute audio button label',
  },
  unmuteAudio: {
    id: 'app.actionsBar.unmuteLabel',
    description: 'Unmute audio button label',
  },
});

const propTypes = {
  handleToggleMuteMicrophone: PropTypes.func.isRequired,
  handleJoinAudio: PropTypes.func.isRequired,
  handleLeaveAudio: PropTypes.func.isRequired,
  disable: PropTypes.bool.isRequired,
  unmute: PropTypes.bool.isRequired,
  mute: PropTypes.bool.isRequired,
  join: PropTypes.bool.isRequired,
  intl: intlShape.isRequired,
  glow: PropTypes.bool,
};

const defaultProps = {
  glow: false,
};

const SHORTCUTS_CONFIG = Meteor.settings.public.app.shortcuts;
const ACCESS_KEY_JOIN_AUDIO = SHORTCUTS_CONFIG.joinAudio.accesskey;
const ACCESS_KEY_LEAVE_AUDIO = SHORTCUTS_CONFIG.leaveAudio.accesskey;
const ACCESS_KEY_MUTE = SHORTCUTS_CONFIG.toggleMute.accesskey;

const AudioControls = ({
  handleToggleMuteMicrophone,
  handleJoinAudio,
  handleLeaveAudio,
  mute,
  unmute,
  disable,
  glow,
  join,
  intl,
}) => (
  <span className={styles.container}>
    {mute ?
      <Button
        className={glow ? cx(styles.button, styles.glow) : styles.button}
        onClick={handleToggleMuteMicrophone}
        disabled={disable}
        hideLabel
        label={unmute ? intl.formatMessage(intlMessages.unmuteAudio) : intl.formatMessage(intlMessages.muteAudio)}
        aria-label={unmute ? intl.formatMessage(intlMessages.unmuteAudio) : intl.formatMessage(intlMessages.muteAudio)}
        color="primary"
        icon={unmute ? 'mute' : 'unmute'}
        size="lg"
        circle
        accessKey={ACCESS_KEY_MUTE}
      /> : null}
    <Button
      className={styles.button}
      onClick={join ? handleLeaveAudio : handleJoinAudio}
      disabled={disable}
      hideLabel
      aria-label={join ? intl.formatMessage(intlMessages.leaveAudio) : intl.formatMessage(intlMessages.joinAudio)}
      label={join ? intl.formatMessage(intlMessages.leaveAudio) : intl.formatMessage(intlMessages.joinAudio)}
      color={join ? 'danger' : 'primary'}
      icon={join ? 'audio_off' : 'audio_on'}
      size="lg"
      circle
      accessKey={join ? ACCESS_KEY_LEAVE_AUDIO : ACCESS_KEY_JOIN_AUDIO}
    />
  </span>);

AudioControls.propTypes = propTypes;
AudioControls.defaultProps = defaultProps;

export default injectIntl(AudioControls);
