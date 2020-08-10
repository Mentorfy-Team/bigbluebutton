import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { defineMessages, intlShape, injectIntl } from 'react-intl';
import Button from '/imports/ui/components/button/component';
import getFromUserSettings from '/imports/ui/services/users-settings';
import withShortcutHelper from '/imports/ui/components/shortcut-help/service';
import InputStreamLiveSelectorContainer from './input-stream-live-selector/container';
import MutedAlert from '/imports/ui/components/muted-alert/component';
import { styles } from './styles';

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
  processToggleMuteFromOutside: PropTypes.func.isRequired,
  handleToggleMuteMicrophone: PropTypes.func.isRequired,
  handleJoinAudio: PropTypes.func.isRequired,
  handleLeaveAudio: PropTypes.func.isRequired,
  disable: PropTypes.bool.isRequired,
  muted: PropTypes.bool.isRequired,
  showMute: PropTypes.bool.isRequired,
  inAudio: PropTypes.bool.isRequired,
  listenOnly: PropTypes.bool.isRequired,
  intl: intlShape.isRequired,
  talking: PropTypes.bool.isRequired,
};

class AudioControls extends PureComponent {
  constructor(props) {
    super(props);
    this.renderLeaveButton = this.renderLeaveButton.bind(this);
  }

  componentDidMount() {
    const { processToggleMuteFromOutside } = this.props;
    if (Meteor.settings.public.allowOutsideCommands.toggleSelfVoice
      || getFromUserSettings('bbb_outside_toggle_self_voice', false)) {
      window.addEventListener('message', processToggleMuteFromOutside);
    }
  }

  renderLeaveButton() {
    const {
      listenOnly,
      inAudio,
      isVoiceUser,
      handleLeaveAudio,
      shortcuts,
      disable,
      intl,
    } = this.props;
    return (inAudio && isVoiceUser && listenOnly) ? (
      <Button
        onClick={handleLeaveAudio}
        disabled={disable}
        hideLabel
        aria-label={intl.formatMessage(intlMessages.leaveAudio)}
        label={intl.formatMessage(intlMessages.leaveAudio)}
        color="primary"
        icon="listen"
        size="lg"
        circle
        accessKey={shortcuts.leaveAudio}
      />
    ) : (<InputStreamLiveSelectorContainer />);
  }

  render() {
    const {
      handleToggleMuteMicrophone,
      handleJoinAudio,
      showMute,
      muted,
      disable,
      talking,
      inAudio,
      intl,
      shortcuts,
      isVoiceUser,
      inputStream,
      isViewer,
      isPresenter,
    } = this.props;

    const label = muted ? intl.formatMessage(intlMessages.unmuteAudio)
    : intl.formatMessage(intlMessages.muteAudio);


    const toggleMuteBtn = (
      <Button
        className={cx(styles.muteToggle, !talking || styles.glow, !muted || styles.btn)}
        onClick={handleToggleMuteMicrophone}
        disabled={disable}
        hideLabel
        label={label}
        aria-label={label}
        color={!muted ? 'primary' : 'default'}
        ghost={muted}
        icon={muted ? 'mute' : 'unmute'}
        size="lg"
        circle
        accessKey={shortcuts.togglemute}
      />
    );

    return (
      <span className={styles.container}>
        {muted ? <MutedAlert {...{ inputStream, isViewer, isPresenter }} /> : null}
        { showMute && isVoiceUser ? toggleMuteBtn : null}
        {
          (inAudio)
            ? this.renderLeaveButton()
            : (
              <Button
                className={cx(styles.button, styles.btn)}
                onClick={handleJoinAudio}
                disabled={disable}
                hideLabel
                aria-label={intl.formatMessage(intlMessages.joinAudio)}
                label={intl.formatMessage(intlMessages.joinAudio)}
                color="default"
                ghost
                icon={'audio_off'}
                size="lg"
                circle
                accessKey={shortcuts.joinAudio}
              />
            )
        }
      </span>);
  }
}

AudioControls.propTypes = propTypes;

export default withShortcutHelper(injectIntl(AudioControls), ['joinAudio', 'leaveAudio', 'toggleMute']);
