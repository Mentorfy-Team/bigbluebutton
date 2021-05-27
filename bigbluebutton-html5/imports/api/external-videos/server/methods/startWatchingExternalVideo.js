import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import Users from '/imports/api/users';
import RedisPubSub from '/imports/startup/server/redis';
import { extractCredentials } from '/imports/api/common/server/helpers';

export default function startWatchingExternalVideo(options) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'StartExternalVideoPubMsg';

  const { meetingId, requesterUserId: userId } = extractCredentials(this.userId);
  const { externalVideoUrl } = options;

  try {
    check(meetingId, String);
    check(userId, String);
    check(externalVideoUrl, String);

    const payload = { externalVideoUrl };

    Logger.info(`User id=${userId} sharing an external video: ${externalVideoUrl} for meeting ${meetingId}`);

    return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, userId, payload);
  } catch (error) {
    Logger.error(`Error on sharing an external video: ${externalVideoUrl} ${error}`);
  }
}
