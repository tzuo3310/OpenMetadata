/*
 *  Copyright 2025 Collate.
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
import { ReactComponent as ExportIcon } from '../../../assets/svg/ic-export.svg';
import { ExportTypes } from '../../../constants/Export.constants';
import { t } from '../../../utils/i18next/LocalUtil';
import { ManageButtonItemLabel } from '../../common/ManageButtonContentItem/ManageButtonContentItem.component';
import { useEntityExportModalProvider } from './EntityExportModalProvider.component';
import { ExportData } from './EntityExportModalProvider.interface';

interface ExportEntityButtonItemProps {
  description: string;
  fqn: string;
  onExport: ExportData['onExport'];
}

export const ExportEntityButtonItem = ({
  description,
  fqn,
  onExport,
}: ExportEntityButtonItemProps) => {
  const { showModal } = useEntityExportModalProvider();

  return (
    <ManageButtonItemLabel
      description={description}
      icon={ExportIcon}
      id="export-button"
      name={t('label.export')}
      onClick={() =>
        showModal({
          name: fqn,
          onExport,
          exportTypes: [ExportTypes.CSV],
        })
      }
    />
  );
};
