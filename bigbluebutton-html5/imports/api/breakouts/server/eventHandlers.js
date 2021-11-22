import RedisPubSub from '/imports/startup/server/redis';
import handleBreakoutJoinURL from './handlers/breakoutJoinURL';
import handleBreakoutStarted from './handlers/breakoutStarted';
import handleUpdateTimeRemaining from './handlers/updateTimeRemaining';
import handleBreakoutClosed from './handlers/breakoutClosed';
import joinedUsersChanged from './handlers/joinedUsersChanged';
import handleBreakoutRoomsList from 'imports/api/breakouts-history/server/handlers/breakoutRoomsList';

RedisPubSub.on('BreakoutRoomStartedEvtMsg', handleBreakoutStarted);
RedisPubSub.on('BreakoutRoomJoinURLEvtMsg', handleBreakoutJoinURL);
RedisPubSub.on('RequestBreakoutJoinURLRespMsg', handleBreakoutJoinURL);
RedisPubSub.on('BreakoutRoomsTimeRemainingUpdateEvtMsg', handleUpdateTimeRemaining);
RedisPubSub.on('BreakoutRoomEndedEvtMsg', handleBreakoutClosed);
RedisPubSub.on('UpdateBreakoutUsersEvtMsg', joinedUsersChanged);
RedisPubSub.on('BreakoutRoomsListEvtMsg', handleBreakoutRoomsList);
