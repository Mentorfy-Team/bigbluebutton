package org.bigbluebutton.core.apps.breakout

import org.bigbluebutton.core.api.{ CaptureSharedNotesReqInternalMsg, EndBreakoutRoomInternalMsg }
import org.bigbluebutton.core.bus.{ BigBlueButtonEvent, InternalEventBus }
import org.bigbluebutton.core.running.{ BaseMeetingActor, HandlerHelpers, LiveMeeting, OutMsgRouter }

trait EndBreakoutRoomInternalMsgHdlr extends HandlerHelpers {
  this: BaseMeetingActor =>

  val liveMeeting: LiveMeeting
  val outGW: OutMsgRouter
  val eventBus: InternalEventBus

  def handleEndBreakoutRoomInternalMsg(msg: EndBreakoutRoomInternalMsg): Unit = {

    if (liveMeeting.props.breakoutProps.captureNotes) {
      val meetingName: String = liveMeeting.props.meetingProp.name
      val event = BigBlueButtonEvent(msg.breakoutId, CaptureSharedNotesReqInternalMsg(msg.parentId, meetingName, liveMeeting.props.breakoutProps.sequence))
      eventBus.publish(event)
    }

    log.info("Breakout room {} ended by parent meeting {}.", msg.breakoutId, msg.parentId)
    sendEndMeetingDueToExpiry(msg.reason, eventBus, outGW, liveMeeting, "system")
  }
}
