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
import { Col, Grid, Layout, Row } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import classNames from 'classnames';
import { lazy, ReactNode } from 'react';
import loginClassBase from '../../../constants/LoginClassBase';
import withSuspenseFallback from '../../AppRouter/withSuspenseFallback';
import DocumentTitle from '../../common/DocumentTitle/DocumentTitle';
import './carousel-layout.less';

const LoginCarousel = withSuspenseFallback(
  lazy(() => import('../../../pages/LoginPage/LoginCarousel'))
);

const LOGIN_FULLSCREEN_CLASSES =
  'tw:relative tw:h-screen tw:min-h-screen tw:w-full tw:overflow-hidden tw:bg-black';

const LOGIN_FULLSCREEN_VIDEO_CLASSES = 'tw:absolute tw:inset-0 tw:z-0';

const LOGIN_FULLSCREEN_FORM_CLASSES =
  'tw:absolute tw:inset-0 tw:z-10 tw:flex tw:items-center tw:justify-center ' +
  'tw:overflow-y-auto login-fullscreen-form';

export const CarouselLayout = ({
  pageTitle,
  children,
  carouselClassName,
}: {
  pageTitle: string;
  children: ReactNode;
  carouselClassName?: string;
}) => {
  const { xl } = Grid.useBreakpoint();
  const hasLoginVideo = Boolean(loginClassBase.getLoginVideo());

  if (hasLoginVideo) {
    return (
      <Layout>
        <DocumentTitle title={pageTitle} />
        <Content
          className={classNames(
            LOGIN_FULLSCREEN_CLASSES,
            carouselClassName,
            'login-fullscreen'
          )}
          data-testid="signin-page">
          <div className={LOGIN_FULLSCREEN_VIDEO_CLASSES}>
            <LoginCarousel />
          </div>
          <div className={LOGIN_FULLSCREEN_FORM_CLASSES}>{children}</div>
        </Content>
      </Layout>
    );
  }

  const formColumn = (
    <Col className="carousel-left-side-container" span={xl ? 10 : 24}>
      {children}
    </Col>
  );

  const mediaColumn = xl && (
    <Col span={14}>
      <div className={classNames('form-carousel-container', carouselClassName)}>
        <LoginCarousel />
      </div>
    </Col>
  );

  return (
    <Layout className="tw:bg-primary">
      <DocumentTitle title={pageTitle} />
      <Content className="p-md">
        <Row data-testid="signin-page" gutter={[48, 0]} wrap={false}>
          {formColumn}
          {mediaColumn}
        </Row>
      </Content>
    </Layout>
  );
};
