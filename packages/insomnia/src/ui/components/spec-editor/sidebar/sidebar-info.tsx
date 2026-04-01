import React, { FunctionComponent } from 'react';

import { t } from '../../../../common/i18n';
import { SidebarItem } from './sidebar-item';
import { SidebarTextItem } from './sidebar-text-item';

export interface SidebarInfoType {
  title: string;
  description: string;
  version: string;
  license: {
    name: string;
  };
}

export interface SidebarInfoProps {
  info: SidebarInfoType;
  childrenVisible: boolean;
  onClick: (section: string, ...args: string[]) => void;
}

export const SidebarInfo: FunctionComponent<SidebarInfoProps> = ({
  info: {
    title,
    description,
    version,
    license,
  },
  childrenVisible,
  onClick,
}) => {
  return (
    <div style={{ height: childrenVisible ? '100%' : 0 }}>
      {title && (
        <SidebarItem onClick={() => onClick('info', 'title')}>
          <SidebarTextItem label={t('specEditor.sidebar.titleLabel')} headline={title} />
        </SidebarItem>
      )}
      {description && (
        <SidebarItem onClick={() => onClick('info', 'description')}>
          <SidebarTextItem label={t('specEditor.sidebar.descriptionLabel')} headline={description} />
        </SidebarItem>
      )}
      {version && (
        <SidebarItem onClick={() => onClick('info', 'version')}>
          <SidebarTextItem label={t('specEditor.sidebar.versionLabel')} headline={version} />
        </SidebarItem>
      )}
      {license && license.name && (
        <SidebarItem onClick={() => onClick('info', 'license')}>
          <SidebarTextItem label={t('specEditor.sidebar.licenseLabel')} headline={license.name} />
        </SidebarItem>
      )}
    </div>
  );
};
