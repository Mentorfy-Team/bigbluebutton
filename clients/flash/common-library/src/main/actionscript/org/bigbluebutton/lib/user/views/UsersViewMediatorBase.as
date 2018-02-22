package org.bigbluebutton.lib.user.views {
	import org.bigbluebutton.lib.main.models.IMeetingData;
	import org.bigbluebutton.lib.main.models.LockSettings2x;
	import org.bigbluebutton.lib.user.events.UserItemSelectedEvent;
	import org.bigbluebutton.lib.user.models.User2x;
	import org.bigbluebutton.lib.user.models.UserChangeEnum;
	import org.bigbluebutton.lib.user.views.models.UserVM;
	import org.bigbluebutton.lib.user.views.models.UsersVMCollection;
	import org.bigbluebutton.lib.video.models.WebcamChangeEnum;
	import org.bigbluebutton.lib.video.models.WebcamStreamInfo;
	
	import robotlegs.bender.bundles.mvcs.Mediator;
	
	public class UsersViewMediatorBase extends Mediator {
		
		[Inject]
		public var view:UsersViewBase;
		
		[Inject]
		public var meetingData:IMeetingData;
		
		[Bindable]
		private var _userCollection:UsersVMCollection;
		
		override public function initialize():void {
			initializeUserCollection();
			view.userList.dataProvider = _userCollection;
			
			meetingData.users.userChangeSignal.add(onUserChangeSignal);
			meetingData.meetingStatus.lockSettingsChangeSignal.add(onLockSettingsChange);
			meetingData.webcams.webcamChangeSignal.add(onWebcamChange);
			
			view.userList.addEventListener(UserItemSelectedEvent.SELECTED, onUserItemSelected);
		}
		
		private function initializeUserCollection():void {
			_userCollection = new UsersVMCollection();
			_userCollection.setRoomLockState(meetingData.meetingStatus.lockSettings.isRoomLocked());
			_userCollection.addUsers(meetingData.users.getUsers());
			//_userCollection.addVoiceUsers(meetingData.voiceUsers.getUsers());
			_userCollection.addWebcams(meetingData.webcams.getAll());
			
			
			_userCollection.refresh();
		}
		
		private function onUserChangeSignal(user:User2x, property:int):void {
			switch (property) {
				case UserChangeEnum.JOIN:
					_userCollection.addUser(user);
					break;
				case UserChangeEnum.LEAVE:
					_userCollection.removeUser(user);
					break;
				case UserChangeEnum.ROLE:
					_userCollection.updateRole(user);
					break;
				case UserChangeEnum.PRESENTER:
					_userCollection.updatePresenter(user);
					break;
				case UserChangeEnum.LOCKED:
					_userCollection.updateUserLock(user);
					break;
				case UserChangeEnum.EMOJI:
					_userCollection.updateEmoji(user);
					break;
			}
		}
		
		private function onLockSettingsChange(newLockSettings:LockSettings2x):void {
			_userCollection.setRoomLockState(newLockSettings.isRoomLocked());
		}
		
		private function onWebcamChange(webcam:WebcamStreamInfo, enum:int):void {
			switch (enum) {
				case WebcamChangeEnum.ADD:
					_userCollection.addWebcam(webcam);
					break
				case WebcamChangeEnum.REMOVE:
					_userCollection.removeWebcam(webcam);
					break;
			}
		}
		
		protected function onUserItemSelected(e:UserItemSelectedEvent):void {
			// leave the implementation to the specific client
		}
		
		override public function destroy():void {
			meetingData.users.userChangeSignal.remove(onUserChangeSignal);
			view.userList.removeEventListener(UserItemSelectedEvent.SELECTED, onUserItemSelected);
			
			super.destroy();
			view = null;
		}
	}
}
