import { useEffect, useRef } from 'react';
import _ from 'lodash';
import {
  layoutSelect,
  layoutSelectInput,
  layoutDispatch,
} from '/imports/ui/components/layout/context';
import DEFAULT_VALUES from '/imports/ui/components/layout/defaultValues';
import { INITIAL_INPUT_STATE } from '/imports/ui/components/layout/initState';
import { ACTIONS, PANELS, CAMERADOCK_POSITION } from '/imports/ui/components/layout/enums';
import { isPresentationEnabled } from '/imports/ui/services/features';

const windowWidth = () => window.document.documentElement.clientWidth;
const windowHeight = () => window.document.documentElement.clientHeight;

const customLayout = (props) => {
  const { bannerAreaHeight, isMobile } = props;

  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }

  const input = layoutSelect((i) => i.input);
  const deviceType = layoutSelect((i) => i.deviceType);
  const isRTL = layoutSelect((i) => i.isRTL);
  const fullscreen = layoutSelect((i) => i.fullscreen);
  const fontSize = layoutSelect((i) => i.fontSize);
  const currentPanelType = layoutSelect((i) => i.currentPanelType);

  const presentationInput = layoutSelectInput((i) => i.presentation);
  const sidebarNavigationInput = layoutSelectInput((i) => i.sidebarNavigation);
  const sidebarContentInput = layoutSelectInput((i) => i.sidebarContent);
  const cameraDockInput = layoutSelectInput((i) => i.cameraDock);
  const actionbarInput = layoutSelectInput((i) => i.actionBar);
  const navbarInput = layoutSelectInput((i) => i.navBar);
  const externalVideoInput = layoutSelectInput((i) => i.externalVideo);
  const screenShareInput = layoutSelectInput((i) => i.screenShare);
  const sharedNotesInput = layoutSelectInput((i) => i.sharedNotes);
  const layoutContextDispatch = layoutDispatch();

  const prevDeviceType = usePrevious(deviceType);

  const throttledCalculatesLayout = _.throttle(() => calculatesLayout(), 50, {
    trailing: true,
    leading: true,
  });

  useEffect(() => {
    window.addEventListener('resize', () => {
      layoutContextDispatch({
        type: ACTIONS.SET_BROWSER_SIZE,
        value: {
          width: window.document.documentElement.clientWidth,
          height: window.document.documentElement.clientHeight,
        },
      });
    });
  }, []);

  useEffect(() => {
    if (deviceType === null) return;

    if (deviceType !== prevDeviceType) {
      // reset layout if deviceType changed
      // not all options is supported in all devices
      init();
    } else {
      throttledCalculatesLayout();
    }
  }, [input, deviceType, isRTL, fontSize, fullscreen]);

  const calculatesDropAreas = (sidebarNavWidth, sidebarContentWidth, cameraDockBounds) => {
    const { height: actionBarHeight } = calculatesActionbarHeight();
    const mediaAreaHeight = windowHeight() - (DEFAULT_VALUES.navBarHeight + actionBarHeight);
    const mediaAreaWidth = windowWidth() - (sidebarNavWidth + sidebarContentWidth);
    const DROP_ZONE_DEFAUL_SIZE = 100;
    const dropZones = {};
    const sidebarSize = sidebarNavWidth + sidebarContentWidth;

    dropZones[CAMERADOCK_POSITION.CONTENT_TOP] = {
      top: DEFAULT_VALUES.navBarHeight,
      left: !isRTL ? sidebarSize : null,
      right: isRTL ? sidebarSize : null,
      width: mediaAreaWidth,
      height: DROP_ZONE_DEFAUL_SIZE,
      zIndex: cameraDockBounds.zIndex,
    };

    dropZones[CAMERADOCK_POSITION.CONTENT_RIGHT] = {
      top: DEFAULT_VALUES.navBarHeight + DROP_ZONE_DEFAUL_SIZE,
      left: !isRTL ? windowWidth() - DROP_ZONE_DEFAUL_SIZE : 0,
      height: mediaAreaHeight - 2 * DROP_ZONE_DEFAUL_SIZE,
      width: DROP_ZONE_DEFAUL_SIZE,
      zIndex: cameraDockBounds.zIndex,
    };

    dropZones[CAMERADOCK_POSITION.CONTENT_BOTTOM] = {
      top: DEFAULT_VALUES.navBarHeight + mediaAreaHeight - DROP_ZONE_DEFAUL_SIZE,
      left: !isRTL ? sidebarSize : null,
      right: isRTL ? sidebarSize : null,
      width: mediaAreaWidth,
      height: DROP_ZONE_DEFAUL_SIZE,
      zIndex: cameraDockBounds.zIndex,
    };

    dropZones[CAMERADOCK_POSITION.CONTENT_LEFT] = {
      top: DEFAULT_VALUES.navBarHeight + DROP_ZONE_DEFAUL_SIZE,
      left: !isRTL ? sidebarSize : null,
      right: isRTL ? sidebarSize : null,
      height: mediaAreaHeight - 2 * DROP_ZONE_DEFAUL_SIZE,
      width: DROP_ZONE_DEFAUL_SIZE,
      zIndex: cameraDockBounds.zIndex,
    };

    dropZones[CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM] = {
      top: windowHeight() - DROP_ZONE_DEFAUL_SIZE,
      left: !isRTL ? sidebarNavWidth : null,
      right: isRTL ? sidebarNavWidth : null,
      width: sidebarContentWidth,
      height: DROP_ZONE_DEFAUL_SIZE,
      zIndex: cameraDockBounds.zIndex,
    };

    return dropZones;
  };

  const init = () => {
    const { sidebarContentPanel } = sidebarContentInput;

    if (isMobile) {
      layoutContextDispatch({
        type: ACTIONS.SET_LAYOUT_INPUT,
        value: _.defaultsDeep(
          {
            sidebarNavigation: {
              isOpen:
                input.sidebarNavigation.isOpen || sidebarContentPanel !== PANELS.NONE || false,
              sidebarNavPanel: sidebarNavigationInput.sidebarNavPanel,
            },
            sidebarContent: {
              isOpen: sidebarContentPanel !== PANELS.NONE,
              sidebarContentPanel: sidebarContentInput.sidebarContentPanel,
            },
            sidebarContentHorizontalResizer: {
              isOpen: false,
            },
            presentation: {
              isOpen: presentationInput.isOpen,
              slidesLength: presentationInput.slidesLength,
              currentSlide: {
                ...presentationInput.currentSlide,
              },
            },
            cameraDock: {
              numCameras: cameraDockInput.numCameras,
            },
            externalVideo: {
              hasExternalVideo: input.externalVideo.hasExternalVideo,
            },
            screenShare: {
              hasScreenShare: input.screenShare.hasScreenShare,
              width: input.screenShare.width,
              height: input.screenShare.height,
            },
            sharedNotes: {
              isPinned: sharedNotesInput.isPinned,
            },
          },
          INITIAL_INPUT_STATE
        ),
      });
    } else {
      layoutContextDispatch({
        type: ACTIONS.SET_LAYOUT_INPUT,
        value: _.defaultsDeep(
          {
            sidebarNavigation: {
              isOpen:
                input.sidebarNavigation.isOpen || sidebarContentPanel !== PANELS.NONE || false,
            },
            sidebarContent: {
              isOpen: sidebarContentPanel !== PANELS.NONE,
              sidebarContentPanel,
            },
            sidebarContentHorizontalResizer: {
              isOpen: false,
            },
            presentation: {
              isOpen: presentationInput.isOpen,
              slidesLength: presentationInput.slidesLength,
              currentSlide: {
                ...presentationInput.currentSlide,
              },
            },
            cameraDock: {
              numCameras: cameraDockInput.numCameras,
            },
            externalVideo: {
              hasExternalVideo: input.externalVideo.hasExternalVideo,
            },
            screenShare: {
              hasScreenShare: input.screenShare.hasScreenShare,
              width: input.screenShare.width,
              height: input.screenShare.height,
            },
            sharedNotes: {
              isPinned: sharedNotesInput.isPinned,
            },
          },
          INITIAL_INPUT_STATE
        ),
      });
    }
    Session.set('layoutReady', true);
    throttledCalculatesLayout();
  };

  const calculatesSidebarContentHeight = (cameraDockHeight) => {
    const { isOpen, slidesLength } = presentationInput;
    const { hasExternalVideo } = externalVideoInput;
    const { hasScreenShare } = screenShareInput;
    const { isPinned: isSharedNotesPinned } = sharedNotesInput;

    const hasPresentation = isPresentationEnabled() && slidesLength !== 0;
    const isGeneralMediaOff =
      !hasPresentation && !hasExternalVideo && !hasScreenShare && !isSharedNotesPinned;

    let sidebarContentHeight = 0;
    if (sidebarContentInput.isOpen) {
      if (isMobile) {
        sidebarContentHeight = windowHeight() - DEFAULT_VALUES.navBarHeight;
      } else if (
        cameraDockInput.numCameras > 0 &&
        cameraDockInput.position === CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM &&
        isOpen &&
        !isGeneralMediaOff
      ) {
        sidebarContentHeight = windowHeight() - cameraDockHeight;
      } else {
        sidebarContentHeight = windowHeight();
      }
      sidebarContentHeight -= bannerAreaHeight();
    }
    return sidebarContentHeight;
  };

  const calculatesCameraDockBounds = (mediaAreaBounds, mediaBounds, sidebarSize) => {
    const { baseCameraDockBounds } = props;

    const baseBounds = baseCameraDockBounds(mediaAreaBounds, sidebarSize);

    // do not proceed if using values from LayoutEngine
    if (Object.keys(baseBounds).length > 0) {
      baseBounds.isCameraHorizontal = false;
      baseBounds.left = 0;
      return baseBounds;
    }

    const { camerasMargin, presentationToolbarMinWidth, navBarHeight } = DEFAULT_VALUES;

    const cameraDockBounds = {};

    let cameraDockHeight = 0;
    let cameraDockWidth = 0;

    const lastSize = Storage.getItem('webcamSize') || { width: 0, height: 0 };
    let { width: lastWidth, height: lastHeight } = lastSize;

    if (cameraDockInput.isDragging) cameraDockBounds.zIndex = 99;
    else cameraDockBounds.zIndex = 1;

    const isCameraTop = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_TOP;
    const isCameraBottom = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_BOTTOM;
    const isCameraLeft = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_LEFT;
    const isCameraRight = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_RIGHT;
    const isCameraSidebar = cameraDockInput.position === CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM;

    const stoppedResizing = prevIsResizing && !isResizing;
    if (stoppedResizing) {
      const isCameraTopOrBottom =
        cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_TOP ||
        cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_BOTTOM;

      Storage.setItem('webcamSize', {
        width: isCameraTopOrBottom || isCameraSidebar ? lastWidth : cameraDockInput.width,
        height: isCameraTopOrBottom || isCameraSidebar ? cameraDockInput.height : lastHeight,
      });

      const updatedLastSize = Storage.getItem('webcamSize');
      lastWidth = updatedLastSize.width;
      lastHeight = updatedLastSize.height;
    }

    if (isCameraTop || isCameraBottom) {
      if ((lastHeight === 0 && !isResizing) || (isCameraTop && isMobile)) {
        cameraDockHeight = min(
          max(mediaAreaBounds.height * 0.2, cameraDockMinHeight),
          mediaAreaBounds.height - cameraDockMinHeight
        );
      } else {
        const height = isResizing ? cameraDockInput.height : lastHeight;
        cameraDockHeight = min(
          max(height, cameraDockMinHeight),
          mediaAreaBounds.height - cameraDockMinHeight
        );
      }

      cameraDockBounds.top = navBarHeight;
      cameraDockBounds.left = mediaAreaBounds.left;
      cameraDockBounds.right = isRTL ? sidebarSize : null;
      cameraDockBounds.minWidth = mediaAreaBounds.width;
      cameraDockBounds.width = mediaAreaBounds.width;
      cameraDockBounds.maxWidth = mediaAreaBounds.width;
      cameraDockBounds.minHeight = cameraDockMinHeight;
      cameraDockBounds.height = cameraDockHeight;
      cameraDockBounds.maxHeight = mediaAreaBounds.height * 0.8;

      if (isCameraBottom) {
        cameraDockBounds.top += mediaAreaBounds.height - cameraDockHeight;
      }

      return cameraDockBounds;
    }

    if (isCameraLeft || isCameraRight) {
      if (lastWidth === 0 && !isResizing) {
        cameraDockWidth = min(
          max(mediaAreaBounds.width * 0.2, cameraDockMinWidth),
          mediaAreaBounds.width - cameraDockMinWidth
        );
      } else {
        const width = isResizing ? cameraDockInput.width : lastWidth;
        cameraDockWidth = min(
          max(width, cameraDockMinWidth),
          mediaAreaBounds.width - cameraDockMinWidth
        );
      }

      cameraDockBounds.top = navBarHeight + bannerAreaHeight();
      cameraDockBounds.width = mediaAreaBounds.width - mediaBoundsWidth;
      cameraDockBounds.maxWidth = mediaAreaBounds.width * 0.8;
      cameraDockBounds.presenterMaxWidth =
        mediaAreaBounds.width - presentationToolbarMinWidth - camerasMargin;
      cameraDockBounds.minHeight = cameraDockMinHeight;
      cameraDockBounds.height = mediaAreaBounds.height;
      cameraDockBounds.maxHeight = mediaAreaBounds.height;
      cameraDockBounds.left = mediaAreaBounds.width - (mediaAreaBounds.width - mediaBoundsWidth) + 10;
      cameraDockBounds.width -= (camerasMargin * 2);
      cameraDockBounds.isCameraHorizontal = true;
      cameraDockBounds.position = CAMERADOCK_POSITION.CONTENT_RIGHT;
      // button size in vertical position
      cameraDockBounds.height -= 20;

      if (isCameraRight) {
        const sizeValue = mediaAreaBounds.left + mediaAreaBounds.width - cameraDockWidth;
        cameraDockBounds.left = !isRTL ? sizeValue - camerasMargin : 0;
        cameraDockBounds.right = isRTL ? sizeValue + sidebarSize - camerasMargin : null;
      } else if (isCameraLeft) {
        cameraDockBounds.left = mediaAreaBounds.left + camerasMargin;
        cameraDockBounds.right = isRTL ? sidebarSize + camerasMargin * 2 : null;
      }

      return cameraDockBounds;
    }

    if (isCameraSidebar) {
      if (lastHeight === 0 && !isResizing) {
        cameraDockHeight = min(
          max(windowHeight() * 0.2, cameraDockMinHeight),
          windowHeight() - cameraDockMinHeight
        );
      } else {
        const height = isResizing ? cameraDockInput.height : lastHeight;
        cameraDockHeight = min(
          max(height, cameraDockMinHeight),
          windowHeight() - cameraDockMinHeight
        );
      }

      cameraDockBounds.top = windowHeight() - cameraDockHeight - bannerAreaHeight();
      cameraDockBounds.left = !isRTL ? sidebarNavWidth : 0;
      cameraDockBounds.right = isRTL ? sidebarNavWidth : 0;
      cameraDockBounds.minWidth = sidebarContentWidth;
      cameraDockBounds.width = sidebarContentWidth;
      cameraDockBounds.maxWidth = sidebarContentWidth;
      cameraDockBounds.minHeight = cameraDockMinHeight;
      cameraDockBounds.height = cameraDockHeight;
      cameraDockBounds.maxHeight = windowHeight() * 0.8;
    }
    return cameraDockBounds;
  };

  const calculatesSlideSize = (mediaAreaBounds) => {
    const { currentSlide } = presentationInput;

    if (currentSlide.size.width === 0 && currentSlide.size.height === 0) {
      return {
        width: 0,
        height: 0,
      };
    }

    let slideWidth;
    let slideHeight;

    slideWidth = (currentSlide.size.width * mediaAreaBounds.height) / currentSlide.size.height;
    slideHeight = mediaAreaBounds.height;

    if (slideWidth > mediaAreaBounds.width) {
      slideWidth = mediaAreaBounds.width;
      slideHeight = (currentSlide.size.height * mediaAreaBounds.width) / currentSlide.size.width;
    }

    return {
      width: slideWidth,
      height: slideHeight,
    };
  };

  const calculatesScreenShareSize = (mediaAreaBounds) => {
    const { width = 0, height = 0 } = screenShareInput;

    if (width === 0 && height === 0) return { width, height };

    let screeShareWidth;
    let screeShareHeight;

    screeShareWidth = (width * mediaAreaBounds.height) / height;
    screeShareHeight = mediaAreaBounds.height;

    if (screeShareWidth > mediaAreaBounds.width) {
      screeShareWidth = mediaAreaBounds.width;
      screeShareHeight = (height * mediaAreaBounds.width) / width;
    }

    return {
      width: screeShareWidth,
      height: screeShareHeight,
    };
  }

  const calculatesMediaBounds = (mediaAreaBounds, slideSize, sidebarSize, screenShareSize) => {
    const { isOpen, slidesLength } = presentationInput;
    const { hasExternalVideo } = externalVideoInput;
    const { hasScreenShare } = screenShareInput;
    const { isPinned: isSharedNotesPinned } = sharedNotesInput;

    const { height: actionBarHeight } = calculatesActionbarHeight();
    const mediaAreaHeight =
      windowHeight() - (DEFAULT_VALUES.navBarHeight + actionBarHeight + bannerAreaHeight());
    const mediaAreaWidth = windowWidth() - (sidebarNavWidth + sidebarContentWidth);
    const mediaBounds = {};
    const { element: fullscreenElement } = fullscreen;
    const { navBarHeight, camerasMargin } = DEFAULT_VALUES;

    const hasPresentation = isPresentationEnabled() && slidesLength !== 0;
    const isGeneralMediaOff =
      !hasPresentation && !hasExternalVideo && !hasScreenShare && !isSharedNotesPinned;

    if (!isOpen || isGeneralMediaOff) {
      mediaBounds.width = 0;
      mediaBounds.height = 0;
      mediaBounds.top = 0;
      mediaBounds.left = !isRTL ? 0 : null;
      mediaBounds.right = isRTL ? 0 : null;
      mediaBounds.zIndex = 0;
      return mediaBounds;
    }

    if (
      fullscreenElement === 'Presentation' ||
      fullscreenElement === 'Screenshare' ||
      fullscreenElement === 'ExternalVideo'
    ) {
      mediaBounds.width = windowWidth();
      mediaBounds.height = windowHeight();
      mediaBounds.top = 0;
      mediaBounds.left = !isRTL ? 0 : null;
      mediaBounds.right = isRTL ? 0 : null;
      mediaBounds.zIndex = 99;
      return mediaBounds;
    }

    const mediaContentSize = hasScreenShare ? screenShareSize : slideSize;

    if (cameraDockInput.numCameras > 0 && !cameraDockInput.isDragging) {
      switch (cameraDockInput.position) {
        case CAMERADOCK_POSITION.CONTENT_TOP: {
          mediaBounds.width = mediaAreaWidth;
          mediaBounds.height = mediaAreaHeight - cameraDockBounds.height - camerasMargin;
          mediaBounds.top =
            navBarHeight + cameraDockBounds.height + camerasMargin + bannerAreaHeight();
          mediaBounds.left = !isRTL ? sidebarSize : null;
          mediaBounds.right = isRTL ? sidebarSize : null;
          break;
        }
        case CAMERADOCK_POSITION.CONTENT_RIGHT: {
          mediaBounds.width = mediaAreaWidth - cameraDockBounds.width - camerasMargin * 2;
          mediaBounds.height = mediaAreaHeight;
          mediaBounds.top = navBarHeight + bannerAreaHeight();
          mediaBounds.left = !isRTL ? sidebarSize : null;
          mediaBounds.right = isRTL ? sidebarSize - camerasMargin * 2 : null;
          break;
        }
        case CAMERADOCK_POSITION.CONTENT_BOTTOM: {
          mediaBounds.width = mediaAreaWidth;
          mediaBounds.height = mediaAreaHeight - cameraDockBounds.height - camerasMargin;
          mediaBounds.top = navBarHeight - camerasMargin + bannerAreaHeight();
          mediaBounds.left = !isRTL ? sidebarSize : null;
          mediaBounds.right = isRTL ? sidebarSize : null;
          break;
        }
        case CAMERADOCK_POSITION.CONTENT_LEFT: {
          mediaBounds.width = mediaAreaWidth - cameraDockBounds.width - camerasMargin * 2;
          mediaBounds.height = mediaAreaHeight;
          mediaBounds.top = navBarHeight + bannerAreaHeight();
          const sizeValue =
            sidebarNavWidth + sidebarContentWidth + mediaAreaWidth - mediaBounds.width;
          mediaBounds.left = !isRTL ? sizeValue : null;
          mediaBounds.right = isRTL ? sidebarSize : null;
          break;
        }
        case CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM: {
          mediaBounds.width = mediaAreaWidth;
          mediaBounds.height = mediaAreaHeight;
          mediaBounds.top = navBarHeight + bannerAreaHeight();
          mediaBounds.left = !isRTL ? sidebarSize : null;
          mediaBounds.right = isRTL ? sidebarSize : null;
          break;
        }
        default: {
          console.log('presentation - camera default');
        }
      }
      mediaBounds.zIndex = 1;
    } else {
      mediaBounds.width = mediaAreaBounds.width;
      mediaBounds.height = mediaAreaBounds.height;
      mediaBounds.top = mediaAreaBounds.top;
      const sizeValue = mediaAreaBounds.left;
      mediaBounds.left = !isRTL ? (mediaAreaBounds.left - sidebarSize) : sizeValue;
      mediaBounds.right = isRTL ? (sidebarSize - mediaAreaBounds.right) : null;
    }
    mediaBounds.zIndex = 1;

    return mediaBounds;
  };

  const calculatesLayout = () => {
    const {
      calculatesNavbarBounds,
      calculatesActionbarBounds,
      calculatesSidebarNavWidth,
      calculatesSidebarNavHeight,
      calculatesSidebarNavBounds,
      calculatesSidebarContentWidth,
      calculatesSidebarContentBounds,
      calculatesMediaAreaBounds,
      isTablet,
    } = props;
    const { camerasMargin, captionsMargin } = DEFAULT_VALUES;

    const sidebarNavWidth = calculatesSidebarNavWidth();
    const sidebarNavHeight = calculatesSidebarNavHeight();
    const sidebarContentWidth = calculatesSidebarContentWidth();
    const sidebarContentHeight = calculatesSidebarContentHeight();
    const sidebarNavBounds = calculatesSidebarNavBounds();
    const sidebarContentBounds = calculatesSidebarContentBounds(sidebarNavWidth.width);
    const mediaAreaBounds = calculatesMediaAreaBounds(
      sidebarNavWidth.width,
      sidebarContentWidth.width
    );
    const navbarBounds = calculatesNavbarBounds(mediaAreaBounds);
    const actionbarBounds = calculatesActionbarBounds(mediaAreaBounds);
    const cameraDockBounds = calculatesCameraDockBounds(
      sidebarNavWidth.width,
      sidebarContentWidth.width,
      mediaAreaBounds
    );
    const dropZoneAreas = calculatesDropAreas(
      sidebarNavWidth.width,
      sidebarContentWidth.width,
      cameraDockBounds
    );
    const sidebarContentHeight = calculatesSidebarContentHeight(cameraDockBounds.height);
    const mediaBounds = calculatesMediaBounds(
      sidebarNavWidth.width,
      sidebarContentWidth.width,
      cameraDockBounds
    );
    const sidebarSize = sidebarContentWidth.width + sidebarNavWidth.width;
    const { height: actionBarHeight } = calculatesActionbarHeight();

    let horizontalCameraDiff = 0;

    if (cameraPosition === CAMERADOCK_POSITION.CONTENT_LEFT) {
      horizontalCameraDiff = cameraDockBounds.width + camerasMargin * 2;
    }

    if (cameraPosition === CAMERADOCK_POSITION.CONTENT_RIGHT) {
      horizontalCameraDiff = camerasMargin * 2;
    }

    layoutContextDispatch({
      type: ACTIONS.SET_NAVBAR_OUTPUT,
      value: {
        display: navbarInput.hasNavBar,
        width: navbarBounds.width,
        height: navbarBounds.height,
        top: navbarBounds.top,
        right: navbarBounds.right,
        tabOrder: DEFAULT_VALUES.navBarTabOrder,
        zIndex: navbarBounds.zIndex,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_ACTIONBAR_OUTPUT,
      value: {
        display: actionbarInput.hasActionBar,
        width: actionbarBounds.width,
        height: actionbarBounds.height,
        innerHeight: actionbarBounds.innerHeight,
        top: actionbarBounds.top,
        right: actionbarBounds.right,
        padding: actionbarBounds.padding,
        tabOrder: DEFAULT_VALUES.actionBarTabOrder,
        zIndex: actionbarBounds.zIndex,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_CAPTIONS_OUTPUT,
      value: {
        right: !isRTL ? (sidebarSize + captionsMargin) : null,
        left: isRTL ? (sidebarSize + captionsMargin) : null,
        maxWidth: mediaAreaBounds.width - (captionsMargin * 2),
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_NAVIGATION_OUTPUT,
      value: {
        display: sidebarNavigationInput.isOpen,
        minWidth: sidebarNavWidth.minWidth,
        width: sidebarNavWidth.width,
        maxWidth: sidebarNavWidth.maxWidth,
        height: sidebarNavHeight,
        top: sidebarNavBounds.top,
        right: sidebarNavBounds.left,
        left: sidebarNavBounds.right,
        tabOrder: DEFAULT_VALUES.sidebarNavTabOrder,
        isResizable: !isMobile && !isTablet,
        zIndex: sidebarNavBounds.zIndex,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_NAVIGATION_RESIZABLE_EDGE,
      value: {
        top: false,
        left: !isRTL,
        bottom: false,
        right: isRTL,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_OUTPUT,
      value: {
        display: sidebarContentInput.isOpen,
        minWidth: sidebarContentWidth.minWidth,
        width: sidebarContentWidth.width,
        maxWidth: sidebarContentWidth.maxWidth,
        height: sidebarContentHeight,
        top: sidebarContentBounds.top,
        right: sidebarContentBounds.left,
        left: sidebarContentBounds.right,
        currentPanelType,
        tabOrder: DEFAULT_VALUES.sidebarContentTabOrder,
        isResizable: !isMobile && !isTablet,
        zIndex: sidebarContentBounds.zIndex,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_RESIZABLE_EDGE,
      value: {
        top: false,
        left: !isRTL,
        bottom: false,
        right: isRTL,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_MEDIA_AREA_SIZE,
      value: {
        width: mediaAreaBounds.width,
        height: mediaAreaBounds.height,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_CAMERA_DOCK_OUTPUT,
      value: {
        display: cameraDockInput.numCameras > 0,
        position: cameraDockBounds.position,
        minWidth: cameraDockBounds.minWidth,
        width: cameraDockBounds.width,
        maxWidth: cameraDockBounds.maxWidth,
        minHeight: cameraDockBounds.minHeight,
        height: cameraDockBounds.height,
        maxHeight: cameraDockBounds.maxHeight,
        top: cameraDockBounds.top,
        right: cameraDockBounds.right,
        left: cameraDockBounds.left,
        tabOrder: 4,
        isDraggable: false,
        resizableEdge: {
          top:
            input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_BOTTOM ||
            (input.cameraDock.position === CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM &&
              input.sidebarContent.isOpen),
          right:
            (!isRTL && input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_LEFT) ||
            (isRTL && input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_RIGHT),
          bottom: input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_TOP,
          left:
            (!isRTL && input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_RIGHT) ||
            (isRTL && input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_LEFT),
        },
        zIndex: cameraDockBounds.zIndex,
        focusedId: input.cameraDock.focusedId,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_PRESENTATION_OUTPUT,
      value: {
        display: presentationInput.isOpen,
        width: mediaBounds.width,
        height: mediaBounds.height,
        top: mediaBounds.top,
        right: mediaBounds.left,
        left: isRTL ? (mediaBounds.right + horizontalCameraDiff) : null,
        tabOrder: DEFAULT_VALUES.presentationTabOrder,
        isResizable: false,
        zIndex: mediaBounds.zIndex,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SCREEN_SHARE_OUTPUT,
      value: {
        width: mediaBounds.width,
        height: mediaBounds.height,
        top: mediaBounds.top,
        left: mediaBounds.left,
        right: isRTL ? mediaBounds.right + horizontalCameraDiff : null,
        zIndex: mediaBounds.zIndex,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_EXTERNAL_VIDEO_OUTPUT,
      value: {
        width: mediaBounds.width,
        height: mediaBounds.height,
        top: mediaBounds.top,
        right: mediaBounds.left,
        left: isRTL ? (mediaBounds.right + horizontalCameraDiff) : null,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SHARED_NOTES_OUTPUT,
      value: {
        width: mediaBounds.width,
        height: mediaBounds.height,
        top: mediaBounds.top,
        right: mediaBounds.left,
        left: isRTL ? (mediaBounds.right + horizontalCameraDiff) : null,
      },
    });
  };

  return null;
};

export default CustomLayout;