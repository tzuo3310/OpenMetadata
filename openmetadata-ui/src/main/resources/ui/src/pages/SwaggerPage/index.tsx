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

import { useCallback, useEffect, useState } from 'react';
import DocumentTitle from '../../components/common/DocumentTitle/DocumentTitle';
import Loader from '../../components/common/Loader/Loader';
import {
  API_DOC_DESCRIPTION,
  API_DOC_HEADING,
  API_DOC_TITLE,
} from '../../constants/SwaggerPage.constants';
import {
  GRAPH_BACKGROUND_COLOR,
  TEXT_BODY_COLOR,
} from '../../constants/constants';
import { useApplicationStore } from '../../hooks/useApplicationStore';
import { getOidcToken } from '../../utils/SwTokenStorageUtils';
import RapiDocReact from './RapiDocReact';
import './swagger.less';

const SwaggerPage = () => {
  const { theme, applicationConfig } = useApplicationStore();
  const [idToken, setIdToken] = useState<string>('');

  const fetchIdToken = async () => {
    const token = await getOidcToken();
    setIdToken(token);
  };

  useEffect(() => {
    fetchIdToken();
  }, []);

  const apiDocTitle = API_DOC_TITLE;
  const apiDocHeading = API_DOC_HEADING;
  const apiDocDescription = API_DOC_DESCRIPTION;

  const customMonogramUrlPath =
    applicationConfig?.customLogoConfig?.customMonogramUrlPath;
  const customLogoUrlPath =
    applicationConfig?.customLogoConfig?.customLogoUrlPath;
  const logoUrl = customMonogramUrlPath || customLogoUrlPath;

  const handleBeforeRender = useCallback(
    (spec: any) => {
      if (!spec?.info) {
        return;
      }
      // Replace upstream branding with the company's own identity.
      spec.info.title = apiDocHeading;
      spec.info.contact = undefined;
      spec.info.license = undefined;
      spec.info.termsOfService = undefined;
      spec.info.externalDocs = undefined;
      if (apiDocDescription) {
        spec.info.description = apiDocDescription;
      }
    },
    [apiDocHeading, apiDocDescription]
  );

  const apiKeyValue = `Bearer ${idToken}`;

  // One title above both branches — the token fetch leaves the page on a
  // loader long enough for a stale tab title to be visible.
  return (
    <>
      <DocumentTitle title={apiDocTitle} />
      {idToken ? (
        <div
          className="container-fluid"
          data-testid="fluid-container"
          id="doc-container">
          <div className="api-doc-branding">
            {logoUrl && (
              <img
                alt={apiDocHeading}
                className="api-doc-branding-logo"
                src={logoUrl}
              />
            )}
            <div className="api-doc-branding-text">
              <div className="api-doc-branding-title">{apiDocHeading}</div>
              {apiDocDescription && (
                <div className="api-doc-branding-description">
                  {apiDocDescription}
                </div>
              )}
            </div>
          </div>
          <RapiDocReact
            allow-spec-file-download="false"
            allow-spec-file-load="false"
            allow-spec-url-load="false"
            api-key-location="header"
            api-key-name="Authorization"
            api-key-value={apiKeyValue}
            beforeRender={handleBeforeRender}
            font-size="large"
            heading-text={apiDocHeading}
            nav-bg-color={GRAPH_BACKGROUND_COLOR}
            nav-item-spacing="compact"
            nav-text-color={TEXT_BODY_COLOR}
            primary-color={theme.primaryColor}
            regular-font="Open Sans"
            render-style="focused"
            show-header="false"
            show-info="false"
            show-method-in-nav-bar="as-colored-block"
            spec-url="./swagger.json"
            text-color={TEXT_BODY_COLOR}
            theme="light"
          />
        </div>
      ) : (
        <Loader />
      )}
    </>
  );
};

export default SwaggerPage;
