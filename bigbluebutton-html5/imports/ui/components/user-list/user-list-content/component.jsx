import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Styled from './styles';
import UserParticipantsContainer from './user-participants/container';
import UserMessages from './user-messages/container';
import UserNotesContainer from './user-notes/container';
import UserCaptionsContainer from './user-captions/container';
import WaitingUsersContainer from './waiting-users/container';
import UserPollsContainer from './user-polls/container';
import BreakoutRoomItem from './breakout-room/component';

const propTypes = {
  currentUser: PropTypes.shape({}).isRequired,
};

const CHAT_ENABLED = Meteor.settings.public.chat.enabled;
const ROLE_MODERATOR = Meteor.settings.public.user.role_moderator;

class UserContent extends PureComponent {
  render() {
    const {
      currentUser,
      pendingUsers,
      isWaitingRoomEnabled,
      isGuestLobbyMessageEnabled,
    } = this.props;

    const showWaitingRoom = (isGuestLobbyMessageEnabled && isWaitingRoomEnabled)
      || pendingUsers.length > 0;

    return (
      <Styled.Content data-test="userListContent">
        {CHAT_ENABLED ? <UserMessages /> : null}
        {currentUser.role === ROLE_MODERATOR ? <UserCaptionsContainer /> : null}
        <UserNotesContainer />
        {showWaitingRoom && currentUser.role === ROLE_MODERATOR
          ? (
            <WaitingUsersContainer {...{ pendingUsers }} />
          ) : null}
        <UserPollsContainer isPresenter={currentUser.presenter} />
        <BreakoutRoomItem isPresenter={currentUser.presenter} />
        <UserParticipantsContainer />
      </Styled.Content>
    );
  }
}

UserContent.propTypes = propTypes;

export default UserContent;
