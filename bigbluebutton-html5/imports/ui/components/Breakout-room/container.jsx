import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import AudioService from '/imports/ui/components/audio/service';
import BreakoutComponent from './component';
import Service from './service';

const BreakoutContainer = props => <BreakoutComponent {...props} />;


export default withTracker((props) => {
  const {
    endAllBreakouts,
    requestJoinURL,
    breakouts,
    breakoutRoomUser,
    transferUserToMeeting,
    transferToBreakout,
    meetingId,
    isPresenter,
  } = Service;
  const breakoutRooms = breakouts();

  const isMicrophoneUser = AudioService.isConnected() && !AudioService.isListenOnly();

  return {
    ...props,
    breakoutRooms,
    endAllBreakouts,
    requestJoinURL,
    breakoutRoomUser,
    transferUserToMeeting,
    transferToBreakout,
    isMicrophoneUser,
    meetingId,
    isPresenter: isPresenter(),
  };
})(BreakoutContainer);
