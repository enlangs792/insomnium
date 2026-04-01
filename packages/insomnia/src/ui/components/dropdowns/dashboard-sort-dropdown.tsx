import React, { FC } from 'react';

import { DASHBOARD_SORT_ORDERS, DashboardSortOrder, getDashboardSortOrderName } from '../../../common/constants';
import { t } from '../../../common/i18n';
import { Dropdown, DropdownButton, DropdownItem, ItemContent } from '../base/dropdown';

interface DashboardSortDropdownProps {
  value: DashboardSortOrder;
  onSelect: (value: DashboardSortOrder) => void;
}

export const DashboardSortDropdown: FC<DashboardSortDropdownProps> = ({ onSelect, value }) => {
  return (
    <Dropdown
      aria-label={t('dashboardSort.dropdown')}
      className="margin-left"
      triggerButton={
        <DropdownButton
          variant='outlined'
          removePaddings={false}
          disableHoverBehavior={false}
        >
          <i className="fa fa-sort" />
        </DropdownButton>
      }
    >
      {DASHBOARD_SORT_ORDERS.map(order => (
        <DropdownItem
          key={order}
          aria-label={getDashboardSortOrderName(order)}
        >
          <ItemContent
            label={getDashboardSortOrderName(order)}
            isSelected={order === value}
            onClick={() => onSelect(order)}
          />
        </DropdownItem>
      ))}
    </Dropdown>
  );
};
