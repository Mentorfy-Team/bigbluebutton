import React, { useContext, useEffect, useState } from 'react';
import { injectIntl, defineMessages } from 'react-intl';
import _ from 'lodash';
import Auth from '/imports/ui/services/auth';
import ConfirmationModal from '/imports/ui/components/common/modal/confirmation/component';
import { CustomVirtualBackgroundsContext } from '/imports/ui/components/video-preview/virtual-background/context';
import { EFFECT_TYPES } from '/imports/ui/services/virtual-background/service';
import { withModalMounter } from '/imports/ui/components/common/modal/service';

const intlMessages = defineMessages({
  confirmationTitle: {
    id: 'app.confirmation.virtualBackground.title',
    description: 'Confirmation modal title',
  },
  confirmationDescription: {
    id: 'app.confirmation.virtualBackground.description',
    description: 'Confirmation modal description',
  },
});

const MIME_TYPES_ALLOWED = ['image/png', 'image/jpeg'];
const MAX_FILE_SIZE = 5000; // KBytes

const DragAndDrop = (props) => {
  const { children, mountModal, intl } = props;

  const [dragging, setDragging] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);
  const { dispatch: dispatchCustomBackground } = useContext(CustomVirtualBackgroundsContext);

  const resetEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  }

  useEffect(() => {
    const onDragOver = (e) => {
      resetEvent(e);
      setDragging(true);
    };
    const onDragLeave = (e) => {
      resetEvent(e);
      setDragging(false);
    };
    const onDrop = (e) => {
      resetEvent(e);
      setDragging(false);
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  const makeDragOperations = (onAction, userId) => {
    if (Auth.userID !== userId) return {};

    const startAndSaveVirtualBackground = (file) => {
      const { name: filename } = file;
      const reader = new FileReader();
      const substrings = filename.split('.');
      substrings.pop();
      const filenameWithoutExtension = substrings.join('');

      reader.onload = function (e) {
        const background = {
          filename: filenameWithoutExtension,
          data: e.target.result,
          uniqueId: _.uniqueId(),
        };

        onAction(EFFECT_TYPES.IMAGE_TYPE, filename, e.target.result).then(() => {
          dispatchCustomBackground({
            type: 'new',
            background,
          });
        });
      };

      reader.readAsDataURL(file);
    };

    const onDragOverHandler = (e) => {
      resetEvent(e);
      setDraggingOver(true);
      setDragging(false);
    }

    const onDropHandler = (e) => {
      resetEvent(e);
      setDraggingOver(false);
      setDragging(false);

      const { files } = e.dataTransfer;
      const file = files[0];
      const { size, type } = file;
      const sizeInKB = size / 1024;

      if (sizeInKB > MAX_FILE_SIZE || !MIME_TYPES_ALLOWED.includes(type)) return;

      if (Session.get('skipBackgroundDropConfirmation')) {
        return startAndSaveVirtualBackground(file);
      }

      const onConfirm = (confirmParam, checked) => {
        startAndSaveVirtualBackground(file);
        Session.set('skipBackgroundDropConfirmation', checked);
      };

      mountModal(
        <ConfirmationModal
          intl={intl}
          onConfirm={onConfirm}
          title={intl.formatMessage(intlMessages.confirmationTitle)}
          description={intl.formatMessage(intlMessages.confirmationDescription, { 0: file.name })}
          checkboxMessageId="app.confirmation.skipConfirm"
        />
      );
    };

    const onDragLeaveHandler = (e) => {
      resetEvent(e);
      setDragging(false);
      setDraggingOver(false);
    }

    return {
      onDragOver: onDragOverHandler,
      onDrop: onDropHandler,
      onDragLeave: onDragLeaveHandler,
      dragging,
      draggingOver,
    };
  }

  return React.cloneElement(children, { ...props, makeDragOperations })
};

const Wrapper = (Component) => (props) => (
  <DragAndDrop {...props} >
    <Component />
  </DragAndDrop>
);

export const withDragAndDrop = (Component) => withModalMounter(injectIntl(Wrapper(Component)));
