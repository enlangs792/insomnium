import React from 'react';

import { t } from '../../../common/i18n';
export const GrpcTag = () => (
  <div
    style={{
      position: 'relative',
    }}
  >
    <div className="tag tag--no-bg tag--small method-grpc">
      <span className="tag__inner">{t('grpc.label')}</span>
    </div>
  </div>
);
