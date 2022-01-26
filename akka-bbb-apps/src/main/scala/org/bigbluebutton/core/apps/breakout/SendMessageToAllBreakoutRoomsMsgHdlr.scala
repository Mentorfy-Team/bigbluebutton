package org.bigbluebutton.core.apps.breakout

import org.bigbluebutton.common2.msgs._
import org.bigbluebutton.core.api.{ ExtendBreakoutRoomTimeInternalMsg, SendMessageToBreakoutRoomInternalMsg, SendTimeRemainingAuditInternalMsg }
import org.bigbluebutton.core.apps.groupchats.GroupChatApp
import org.bigbluebutton.core.apps.{ PermissionCheck, RightsManagementTrait }
import org.bigbluebutton.core.bus.BigBlueButtonEvent
import org.bigbluebutton.core.domain.MeetingState2x
import org.bigbluebutton.core.models.{ GroupChatMessage, RegisteredUsers }
import org.bigbluebutton.core.running.{ MeetingActor, OutMsgRouter }
import org.bigbluebutton.core.util.TimeUtil

trait SendMessageToAllBreakoutRoomsMsgHdlr extends RightsManagementTrait {
  this: MeetingActor =>

  val outGW: OutMsgRouter

  def handleSendMessageToAllBreakoutRoomsMsg(msg: SendMessageToAllBreakoutRoomsMsg, state: MeetingState2x): MeetingState2x = {
    log.debug("handleSendMessageToAllBreakoutRoomsMsg {} in meeting {}", msg.body.msg, props.meetingProp.intId)
    if (permissionFailed(PermissionCheck.MOD_LEVEL, PermissionCheck.VIEWER_LEVEL, liveMeeting.users2x, msg.header.userId)) {
      val meetingId = liveMeeting.props.meetingProp.intId
      val reason = "No permission to send message to all breakout rooms for meeting."
      PermissionCheck.ejectUserForFailedPermission(meetingId, msg.header.userId, reason, outGW, liveMeeting)
      state
    } else {
      for {
        breakoutModel <- state.breakout
        senderUser <- RegisteredUsers.findWithUserId(msg.header.userId, liveMeeting.registeredUsers)
      } yield {
        breakoutModel.rooms.values.foreach { room =>
          eventBus.publish(BigBlueButtonEvent(room.id, SendMessageToBreakoutRoomInternalMsg(props.breakoutProps.parentId, room.id, senderUser.name, msg.body.msg)))
        }
        log.debug("Sending message '{}' for breakout rooms in meeting {}", msg.body.msg, props.meetingProp.intId)
      }

      state
    }
  }

}
