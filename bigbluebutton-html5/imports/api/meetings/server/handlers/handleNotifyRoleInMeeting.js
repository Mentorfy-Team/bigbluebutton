import { check } from 'meteor/check';
import emitNotification from '/imports/api/meetings/server/modifiers/emitNotification';

export default function handleNotifyRoleInMeeting({ body }) {
  check(body, {
    role: String,
    meetingId: String,
    notificationType: String,
    icon: String,
    messageId: String,
    messageValues: Array,
  });
  return emitNotification(body, 'NotifyRoleInMeeting');
}
