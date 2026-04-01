import React, { FunctionComponent } from 'react';

import { t } from '../../../common/i18n';
import { GrpcMethodType } from '../../../main/ipc/grpc';
import { Button, ButtonProps } from '../themed-button';

interface Props {
  running: boolean;
  methodType?: GrpcMethodType;
  handleStart: () => Promise<void>;
  handleCancel: () => void;
}

const buttonProps: ButtonProps = {
  className: 'tall',
  bg: 'surprise',
  size: 'medium',
  variant: 'contained',
  radius: '0',
};

export const GrpcSendButton: FunctionComponent<Props> = ({ running, methodType, handleStart, handleCancel }) => {
  if (running) {
    return (
      <Button {...buttonProps} onClick={handleCancel}>
        {t('modal.cancel')}
      </Button>
    );
  }

  if (!methodType) {
    return (
      <Button {...buttonProps} disabled>
        {t('grpcSendButton.send')}
      </Button>
    );
  }

  return (
    <Button {...buttonProps} onClick={handleStart}>
      {methodType === 'unary' ? t('grpcSendButton.send') : t('grpcSendButton.start')}
    </Button>
  );
};
