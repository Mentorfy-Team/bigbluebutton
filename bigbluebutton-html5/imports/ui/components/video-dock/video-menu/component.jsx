import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import Button from '/imports/ui/components/button/component';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';

const intlMessages = defineMessages({
  joinVideo: {
    id: 'app.video.joinVideo',
    description: 'Join video button label',
  },
  leaveVideo: {
    id: 'app.video.leaveVideo',
    description: 'Leave video button label',
  },
});

class JoinVideoOptions extends React.Component {
  render() {
    const {
      intl,
      isSharingVideo,
      handleJoinVideo,
      handleCloseVideo,
    } = this.props;

    if (isSharingVideo) {
        return (
          <Button
            onClick={handleCloseVideo}
            label={intl.formatMessage(intlMessages.leaveVideo)}
            color={'danger'}
            icon={'video'}
            size={'lg'}
            circle
          />
        );
    }

    return (
      <Button
        onClick={handleJoinVideo}
        label={intl.formatMessage(intlMessages.joinVideo)}
        color={'primary'}
        icon={'video_off'}
        size={'lg'}
        circle
      />
    );
  }
}

export default withRouter(injectIntl(JoinVideoOptions));
