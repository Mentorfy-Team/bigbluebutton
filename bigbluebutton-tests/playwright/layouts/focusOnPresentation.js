const { expect } = require('@playwright/test');
const e = require('../core/elements');
const { MultiUsers } = require('../user/multiusers');

class FocusOnPresentation extends MultiUsers {
  constructor(browser, context) {
    super(browser, context);
  }

  async test() {
    await this.modPage.shareWebcam();
    await this.modPage2.shareWebcam();
    await this.modPage.waitAndClick(e.actions);
    await this.modPage.waitAndClick(e.layoutSettingsModalButton);
    await this.modPage.waitAndClick(e.focusOnPresentation);
    await this.modPage.waitAndClick(e.confirmButton);

    const modPageCameraDockLocator = await this.modPage.getLocator(e.cameraDock);
    await expect(this.modPage.page).toHaveScreenshot('moderator1-focus-on-presentation.png', {
      maxDiffPixels: 1000,
      mask: [modPageCameraDockLocator],
    });

    const modPage2CameraDockLocator = await this.modPage2.getLocator(e.cameraDock);
    await expect(this.modPage2.page).toHaveScreenshot('moderator2-focus-on-presentation.png', {
      maxDiffPixels: 1000,
      mask: [modPage2CameraDockLocator],
    });
  }
}

exports.FocusOnPresentation = FocusOnPresentation;
