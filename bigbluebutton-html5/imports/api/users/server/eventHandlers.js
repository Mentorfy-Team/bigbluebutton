import RedisPubSub from '/imports/startup/server/redis';
import handleRemoveUser from './handlers/removeUser';
import handleUserJoined from './handlers/userJoined';
import handleValidateAuthToken from './handlers/validateAuthToken';
import handlePresenterAssigned from './handlers/presenterAssigned';
import handleEmojiStatus from './handlers/emojiStatus';
import handleChangeRole from './handlers/changeRole';
import handleUserPinChanged from './handlers/userPinChanged';
import handleUserInactivityInspect from './handlers/userInactivityInspect';

RedisPubSub.on('PresenterAssignedEvtMsg', handlePresenterAssigned);
RedisPubSub.on('UserJoinedMeetingEvtMsg', handleUserJoined);
RedisPubSub.on('UserLeftMeetingEvtMsg', handleRemoveUser);
RedisPubSub.on('ValidateAuthTokenRespMsg', handleValidateAuthToken);
RedisPubSub.on('UserEmojiChangedEvtMsg', handleEmojiStatus);
RedisPubSub.on('UserRoleChangedEvtMsg', handleChangeRole);
RedisPubSub.on('UserPinStateChangedEvtMsg', handleUserPinChanged);
RedisPubSub.on('UserInactivityInspectMsg', handleUserInactivityInspect);
