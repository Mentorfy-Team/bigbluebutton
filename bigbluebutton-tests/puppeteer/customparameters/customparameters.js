const Page = require('../core/page');
const params = require('../params');
const ne = require('../notifications/elements');
const pe = require('../core/elements');
const cpe = require('./elements');
const we = require('../webcam/elements');
const ae = require('../audio/elements');
const ce = require('../chat/elements');
const util = require('./util');
const c = require('./constants');
const { ELEMENT_WAIT_TIME, VIDEO_LOADING_WAIT_TIME, ELEMENT_WAIT_LONGER_TIME } = require('../core/constants'); // core constants (Timeouts vars imported)
const { checkElementLengthEqualTo, checkElementLengthDifferentTo } = require('../core/util');

class CustomParameters {
  constructor() {
    this.page1 = new Page();
    this.page2 = new Page();
    this.name = name;
    this.screenshotIndex = 0;
    this.parentDir = this.getParentDir(__dirname);
  }

  getParentDir(dir) {
    const tmp = dir.split('/');
    tmp.pop();
    return tmp.join('/');
  }

  async autoJoin(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.waitForSelector('div[data-test="chatMessages"]', ELEMENT_WAIT_TIME);
    await this.page1.waitForSelector(ce.chatMessages, ELEMENT_WAIT_TIME);
    const resp = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.audioModal, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `02-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async listenOnlyMode(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.waitForSelector(pe.audioDialog, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `01-page1-${testName}`);
    const audioOptionsButton = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.audioOptionsButtons, 1);
    if (!audioOptionsButton) {
      await this.page1.screenshot(`${testName}`, `04-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `04-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return true;
  }

  async forceListenOnly(testName, args, meetingId, customParameter) {
    await this.page2.init(args, meetingId, { ...params, fullName: 'Attendee', moderatorPW: '' }, customParameter, testName);
    await this.page2.startRecording(testName);
    await this.page2.screenshot(`${testName}`, `01-${testName}`);
    if (await this.page2.page.$(cpe.audioModalHeader)) {
      await this.page2.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page2.logger(testName, ' failed');
      return false;
    }
    await this.page2.waitForSelector(cpe.toastContainer, ELEMENT_WAIT_TIME);
    await this.page2.screenshot(`${testName}`, `02-success-${testName}`);
    const resp = await util.forceListenOnly(this.page2);
    await this.page2.screenshot(`${testName}`, `03-success-${testName}`);
    this.page2.logger(testName, ' passed');
    return resp === true;
  }

  async skipCheck(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.click(ae.microphone, true);
    await this.page1.waitForSelector(ae.connectingStatus, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.waitForElementHandleToBeRemoved(ae.connectingStatus, ELEMENT_WAIT_LONGER_TIME);
    await this.page1.screenshot(`${testName}`, `03-${testName}`);
    const resp = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.echoTestYesButton, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `04-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `04-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async skipCheckOnFirstJoin(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.click(ae.microphone, true);
    const firstCheck = await this.page1.page.evaluate(checkElementLengthDifferentTo, ae.connecting, 0);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.leaveAudio();
    await this.page1.screenshot(`${testName}`, `03-${testName}`);
    await this.page1.waitForSelector(pe.joinAudio, ELEMENT_WAIT_TIME);
    await this.page1.click(pe.joinAudio, true);
    await this.page1.click(ae.microphone, true);
    const secondCheck = await this.page1.page.evaluate(checkElementLengthDifferentTo, ae.connectingToEchoTest, 0);

    if (firstCheck !== secondCheck) {
      await this.page1.screenshot(`${testName}`, `04-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `04-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return true;
  }

  async clientTitle(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.waitForSelector(pe.whiteboard, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const resp = await (await this.page1.page.title()).includes(c.docTitle);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async askForFeedbackOnLogout(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.logoutFromMeeting();
    await this.page1.screenshot(`${testName}`, `03-${testName}`);
    await this.page1.waitForSelector(cpe.meetingEndedModal, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `04-${testName}`);
    this.page1.logger('audio modal closed');
    const resp = await this.page1.page.evaluate(checkElementLengthDifferentTo, cpe.rating, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `05-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `05-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async displayBrandingArea(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    this.page1.logger('audio modal closed');
    await this.page1.waitForSelector(cpe.userListContent, ELEMENT_WAIT_TIME);
    const resp = await this.page1.page.evaluate(checkElementLengthDifferentTo, cpe.brandingAreaLogo, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async shortcuts(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    this.page1.logger('audio modal closed');
    await this.page1.waitForSelector(pe.options, ELEMENT_WAIT_TIME);
    await this.page1.page.keyboard.down('Alt');
    await this.page1.page.keyboard.press('O');
    const resp = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.verticalListOptions, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async enableScreensharing(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    const resp = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.screenShareButton, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `02-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async enableVideo(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    const resp = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.shareWebcamButton, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `02-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async autoShareWebcam(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const resp = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.webcamSettingsModal, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async multiUserPenOnly(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page2.init(args, this.page1.meetingId, { ...params, fullName: 'Moderator2' }, customParameter, testName);
    await this.page2.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `01-page2-${testName}`);
    await this.page1.closeAudioModal();
    await this.page2.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `02-page2-${testName}`);
    await this.page1.waitForSelector(cpe.multiUsersWhiteboard, ELEMENT_WAIT_TIME);
    await this.page1.click(cpe.multiUsersWhiteboard, true);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.waitForSelector(cpe.tools, ELEMENT_WAIT_TIME);
    await this.page2.click(cpe.tools, true);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);
    const resp = await this.page2.page.evaluate((toolsElement) => {
      return document.querySelectorAll(toolsElement)[0].parentElement.childElementCount === 1;
    }, cpe.tools);
    if (!resp) {
      await this.page2.screenshot(`${testName}`, `05-page2-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page2.screenshot(`${testName}`, `05-page2-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async presenterTools(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.waitForSelector(cpe.tools, ELEMENT_WAIT_TIME);
    await this.page1.click(cpe.tools, true);
    await this.page1.screenshot(`${testName}`, `03-${testName}`);
    const resp = await this.page1.page.evaluate((toolsElement, toolbarListSelector) => {
      return document.querySelectorAll(toolsElement)[0].parentElement.querySelector(toolbarListSelector).childElementCount === 2;
    }, cpe.tools, cpe.toolbarListClass);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `04-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `04-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async multiUserTools(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page2.init(args, this.page1.meetingId, { ...params, fullName: 'Moderator2' }, customParameter, testName);
    await this.page2.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `01-page2-${testName}`);
    await this.page1.closeAudioModal();
    await this.page2.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `02-page2-${testName}`);
    await this.page1.waitForSelector(cpe.multiUsersWhiteboard), ELEMENT_WAIT_TIME;
    await this.page1.click(cpe.multiUsersWhiteboard, true);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.waitForSelector(cpe.tools, ELEMENT_WAIT_TIME);
    await this.page2.click(cpe.tools, true);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);
    const resp = await this.page2.page.evaluate((toolsElement, toolbarListSelector) => {
      return document.querySelectorAll(toolsElement)[0].parentElement.querySelector(toolbarListSelector).childElementCount === 2;
    }, cpe.tools, cpe.toolbarListClass);
    if (!resp) {
      await this.page2.screenshot(`${testName}`, `05-page2-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page2.screenshot(`${testName}`, `05-page2-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async customStyle(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.whiteboard, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const isHidden = await this.page1.page.$eval(cpe.presentationTitle, elem => elem.offsetHeight == 0);
    if (isHidden !== true) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    const resp = isHidden;
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async customStyleUrl(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.whiteboard, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const isHidden = await this.page1.page.$eval(cpe.presentationTitle, elem => elem.offsetHeight == 0);
    if (isHidden !== true) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    const resp = isHidden;
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async autoSwapLayout(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(pe.actions, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const isNotHidden = await this.page1.page.$eval(cpe.restorePresentation, elem => elem.offsetHeight !== 0);
    if (isNotHidden !== true) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    const resp = isNotHidden;
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async hidePresentation(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.actions, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const resp = await this.page1.page.evaluate(checkElementLengthDifferentTo, cpe.defaultContent, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async bannerText(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.actions, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const resp = await this.page1.page.evaluate(checkElementLengthDifferentTo, cpe.notificationBar, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async bannerColor(testName, args, meetingId, customParameter, colorToRGB) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(cpe.notificationBar, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    const notificationBarColor = await this.page1.page.$eval('div[class^="notificationsBar--"]', elem => getComputedStyle(elem).backgroundColor);
    if (notificationBarColor !== colorToRGB) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return true;
  }

  async hideAndSwapPresentation(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(pe.actions, ELEMENT_WAIT_TIME);
    const resp = await this.page1.page.evaluate(checkElementLengthDifferentTo, cpe.restorePresentation, 0) && await this.page1.page.evaluate(checkElementLengthDifferentTo, cpe.defaultContent, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async showPublicChatOnLogin(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.waitForSelector(pe.actions, ELEMENT_WAIT_TIME);
    const resp = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.chat, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async forceRestorePresentationOnNewEvents(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page2.init(args, this.page1.meetingId, { ...params, fullName: 'Viewer1', moderatorPW: '' }, customParameter, testName);
    await this.page2.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `01-page2-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-page1-${testName}`);
    await this.page2.closeAudioModal();
    await this.page2.screenshot(`${testName}`, `02-page2-${testName}`);
    await this.page2.waitForSelector(cpe.hidePresentation, ELEMENT_WAIT_TIME);
    await this.page2.click(cpe.hidePresentation, true);
    await this.page2.screenshot(`${testName}`, `03-page2-${testName}`);
    const zoomInCase = await util.zoomIn(this.page1);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);
    const zoomOutCase = await util.zoomOut(this.page1);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);
    const pollCase = await util.poll(this.page1, this.page2);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);
    const previousSlideCase = await util.previousSlide(this.page1);
    await this.page1.screenshot(`${testName}`, `04-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `05-page2-${testName}`);
    const nextSlideCase = await util.nextSlide(this.page1);
    await this.page1.screenshot(`${testName}`, `05-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `06-page2-${testName}`);
    const annotationCase = await util.annotation(this.page1);
    await this.page1.screenshot(`${testName}`, `06-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `07-page2-${testName}`);

    const test = await this.page2.page.evaluate(checkElementLengthDifferentTo, cpe.restorePresentation, 0);
    const resp = (zoomInCase && zoomOutCase && pollCase && previousSlideCase && nextSlideCase && annotationCase && test);
    if (resp) {
      await this.page2.screenshot(`${testName}`, `08-page2-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page2.page.evaluate(checkElementLengthEqualTo, cpe.restorePresentation, 0);
    await this.page2.screenshot(`${testName}`, `08-page2-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return true;
  }

  async forceRestorePresentationOnNewPollResult(args, meetingId, customParameter, testName) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator1' }, customParameter, testName);
    await this.page2.init(args, this.page1.meetingId, { ...params, fullName: 'Viewer1', moderatorPW: '' }, customParameter, testName);
    await this.page2.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `01-page2-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-page1-${testName}`);
    await this.page2.closeAudioModal();
    await this.page2.screenshot(`${testName}`, `02-page2-${testName}`);
    await this.page2.click(cpe.hidePresentation, true);
    await this.page2.screenshot(`${testName}`, `03-page2-${testName}`);
    const pollCase = await util.poll(this.page1, this.page2) === true;
    await this.page2.waitForSelector(ne.smallToastMsg, ELEMENT_WAIT_TIME);
    await this.page1.screenshot(`${testName}`, `03-page1-${testName}`);
    await this.page2.screenshot(`${testName}`, `04-page2-${testName}`);

    const test = await this.page2.page.evaluate(checkElementLengthDifferentTo, cpe.restorePresentation, 0);
    if (pollCase && test) {
      await this.page2.screenshot(`${testName}`, `05-page2-fail-${testName}`);
      await this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page2.screenshot(`${testName}`, `05-page2-success-${testName}`);
    await this.page1.logger(testName, ' passed');
    return true;
  }

  async recordMeeting(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    const resp = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.recordingIndicator, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `02-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `02-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async skipVideoPreview(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.waitForSelector(cpe.shareWebcamButton, ELEMENT_WAIT_TIME);
    await this.page1.click(cpe.shareWebcamButton, true);
    const resp = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.webcamSettingsModal, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async skipVideoPreviewOnFirstJoin(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.waitForSelector(we.joinVideo, ELEMENT_WAIT_TIME);
    await this.page1.click(we.joinVideo, true);
    const firstCheck = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.webcamSettingsModal, 0);
    await this.page1.waitForSelector(we.leaveVideo, VIDEO_LOADING_WAIT_TIME);
    await this.page1.click(we.leaveVideo, true);
    await this.page1.waitForElementHandleToBeRemoved(we.webcamVideo), ELEMENT_WAIT_LONGER_TIME;
    await this.page1.waitForElementHandleToBeRemoved(we.leaveVideo, ELEMENT_WAIT_LONGER_TIME);

    await this.page1.waitForSelector(we.joinVideo, ELEMENT_WAIT_TIME);
    await this.page1.click(we.joinVideo, true);
    const parsedSettings = await this.page1.getSettingsYaml();
    const videoPreviewTimeout = parseInt(parsedSettings.public.kurento.gUMTimeout);
    await this.page1.waitForSelector(cpe.webcamVideoPreview, videoPreviewTimeout);
    await this.page1.waitForSelector(cpe.startSharingWebcamButton, ELEMENT_WAIT_TIME);
    const secondCheck = await this.page1.page.evaluate(checkElementLengthDifferentTo, cpe.webcamSettingsModal, 0);
    await this.page1.click(cpe.startSharingWebcamButton, true);
    await this.page1.waitForSelector(we.webcamConnecting, ELEMENT_WAIT_TIME);

    if (firstCheck !== secondCheck) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return true;
  }

  async mirrorOwnWebcam(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.waitForSelector(cpe.shareWebcamButton, ELEMENT_WAIT_TIME);
    await this.page1.click(cpe.shareWebcamButton, true);
    await this.page1.waitForSelector(cpe.webcamMirroredVideoPreview, ELEMENT_WAIT_TIME);
    await this.page1.waitForSelector(cpe.startSharingWebcamButton, ELEMENT_WAIT_TIME);
    await this.page1.click(cpe.startSharingWebcamButton, true);
    const resp = await this.page1.page.evaluate(checkElementLengthDifferentTo, cpe.webcamMirroredVideoContainer, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async showParticipantsOnLogin(testName, args, meetingId, customParameter) {
    await this.page1.init(args, meetingId, { ...params, fullName: 'Moderator' }, customParameter, testName);
    await this.page1.startRecording(testName);
    await this.page1.screenshot(`${testName}`, `01-${testName}`);
    await this.page1.closeAudioModal();
    await this.page1.screenshot(`${testName}`, `02-${testName}`);
    await this.page1.waitForSelector(cpe.whiteboard, ELEMENT_WAIT_TIME);
    const resp = await this.page1.page.evaluate(checkElementLengthEqualTo, cpe.userslistContainer, 0);
    if (!resp) {
      await this.page1.screenshot(`${testName}`, `03-fail-${testName}`);
      this.page1.logger(testName, ' failed');
      return false;
    }
    await this.page1.screenshot(`${testName}`, `03-success-${testName}`);
    this.page1.logger(testName, ' passed');
    return resp === true;
  }

  async closePage(page) {
    page.close();
  }

  async close(page1, page2) {
    page1.close();
    page2.close();
  }
}

module.exports = exports = CustomParameters;
