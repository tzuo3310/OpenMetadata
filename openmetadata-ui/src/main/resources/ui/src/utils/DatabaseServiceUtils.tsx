/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import type { NavigateFunction } from 'react-router-dom';
import { ReactComponent as ImportIcon } from '../assets/svg/ic-import.svg';
import { ManageButtonItemLabel } from '../components/common/ManageButtonContentItem/ManageButtonContentItem.component';
import { ExportEntityButtonItem } from '../components/Entity/EntityExportModalProvider/ExportEntityButtonItem.component';
import type { OperationPermission } from '../context/PermissionProvider/PermissionProvider.interface';
import { EntityType } from '../enums/entity.enum';
import { exportDatabaseServiceDetailsInCSV } from '../rest/serviceAPI';
import { getEntityImportPath } from './EntityPureUtils';
import { t } from './i18next/LocalUtil';

export const ExtraDatabaseServiceDropdownOptions = (
  fqn: string,
  permission: OperationPermission,
  deleted: boolean,
  navigate: NavigateFunction
) => {
  const { ViewAll, EditAll } = permission;

  return [
    ...(EditAll && !deleted
      ? [
          {
            label: (
              <ManageButtonItemLabel
                description={t('message.import-entity-help', {
                  entity: t('label.entity-service', {
                    entity: t('label.database'),
                  }),
                })}
                icon={ImportIcon}
                id="import-button"
                name={t('label.import')}
                onClick={() =>
                  navigate(
                    getEntityImportPath(EntityType.DATABASE_SERVICE, fqn)
                  )
                }
              />
            ),
            key: 'import-button',
          },
        ]
      : []),
    ...(ViewAll && !deleted
      ? [
          {
            label: (
              <ExportEntityButtonItem
                description={t('message.export-entity-help', {
                  entity: t('label.entity-service', {
                    entity: t('label.database'),
                  }),
                })}
                fqn={fqn}
                onExport={exportDatabaseServiceDetailsInCSV}
              />
            ),
            key: 'export-button',
          },
        ]
      : []),
  ];
};
