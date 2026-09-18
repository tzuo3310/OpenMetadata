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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Tour from '../../components/AppTour/Tour';
import DocumentTitle from '../../components/common/DocumentTitle/DocumentTitle';
import {
  ExploreSearchIndex,
  SearchHitCounts,
} from '../../components/Explore/ExplorePage.interface';
import { TOUR_SEARCH_TERM } from '../../constants/constants';
import {
  mockDatasetData,
  mockSearchData,
  MOCK_EXPLORE_PAGE_COUNT,
} from '../../constants/mockTourData.constants';
import { useTourProvider } from '../../context/TourProvider/TourProvider';
import { EntityTabs } from '../../enums/entity.enum';
import { CurrentTourPageType } from '../../enums/tour.enum';
import { SearchResponse } from '../../interface/search.interface';
import { getTourSteps } from '../../utils/TourUtils';
import ExplorePageV1Component from '../ExplorePage/ExplorePageV1.component';
import MyDataPage from '../MyDataPage/MyDataPage.component';
import TableDetailsPageV1 from '../TableDetailsPageV1/TableDetailsPageV1';

const TOUR_FEED_WIDGET_SELECTOR = '#feedWidgetData';
// 从 mock 表 id 派生搜索卡片选择器，避免与 mock 数据脱节的硬编码 GUID
const TOUR_SEARCH_CARD_SELECTOR = `#search-card-${mockDatasetData.tableDetails.id}`;
const REQUIRED_STABLE_LAYOUT_FRAMES = 3;
const ELEMENT_POLL_INTERVAL_MS = 50;
const TOUR_START_DELAY_MS = 300;

type TourTargetRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

const getTourFeedWidgetRect = (): TourTargetRect | undefined => {
  const feedWidget = document.querySelector(TOUR_FEED_WIDGET_SELECTOR);
  const feedWidgetRect = feedWidget?.getBoundingClientRect();

  if (!feedWidgetRect?.width || !feedWidgetRect.height) {
    return;
  }

  return {
    height: feedWidgetRect.height,
    left: feedWidgetRect.left,
    top: feedWidgetRect.top,
    width: feedWidgetRect.width,
  };
};

const isSameWidgetRect = (
  currentRect?: TourTargetRect,
  previousRect?: TourTargetRect
) => {
  return (
    currentRect?.height === previousRect?.height &&
    currentRect?.left === previousRect?.left &&
    currentRect?.top === previousRect?.top &&
    currentRect?.width === previousRect?.width
  );
};

const waitForTourFeedWidget = (onReady: () => void) => {
  let animationFrameId = 0;
  let stableLayoutFrames = 0;
  let previousRect: TourTargetRect | undefined;

  const waitForFeedWidget = () => {
    const currentRect = getTourFeedWidgetRect();

    if (currentRect && isSameWidgetRect(currentRect, previousRect)) {
      stableLayoutFrames += 1;
    } else {
      stableLayoutFrames = 0;
    }

    previousRect = currentRect;

    if (stableLayoutFrames >= REQUIRED_STABLE_LAYOUT_FRAMES) {
      onReady();

      return;
    }

    animationFrameId = window.requestAnimationFrame(waitForFeedWidget);
  };

  waitForFeedWidget();

  return () => {
    window.cancelAnimationFrame(animationFrameId);
  };
};

const waitForElement = (selector: string, onReady: () => void) => {
  let timeoutId = 0;

  const check = () => {
    const element = document.querySelector(selector);
    const rect = element?.getBoundingClientRect();
    const hasContent = Boolean(element?.textContent?.trim());

    if (element && rect && rect.width > 0 && rect.height > 0 && hasContent) {
      onReady();
    } else {
      timeoutId = window.setTimeout(check, ELEMENT_POLL_INTERVAL_MS);
    }
  };

  check();

  return () => {
    window.clearTimeout(timeoutId);
  };
};

const TourPage = () => {
  const {
    updateIsTourOpen,
    currentTourPage,
    updateActiveTab,
    updateTourPage,
    updateTourSearch,
    updateTourMockData,
  } = useTourProvider();
  const { t } = useTranslation();
  const [isTourReady, setIsTourReady] = useState(false);

  const clearSearchTerm = useCallback(() => {
    updateTourSearch('');
  }, [updateTourSearch]);

  // Seed mock data on mount so tour-aware pages read it from the provider
  // instead of each one fetching the chunk via a dynamic import that races
  // react-tour's stepWaitTimer.
  useEffect(() => {
    updateTourMockData?.({
      searchResults:
        mockSearchData as unknown as SearchResponse<ExploreSearchIndex>,
      searchHitCounts: MOCK_EXPLORE_PAGE_COUNT as SearchHitCounts,
      datasetData: mockDatasetData,
    });
  }, [updateTourMockData]);

  // Reset on /tour entry — react-tour's stepIndex resets on remount but
  // TourProvider state persists across the SPA session; keep them in sync.
  useEffect(() => {
    updateTourPage(CurrentTourPageType.MY_DATA_PAGE);
    updateActiveTab(EntityTabs.SCHEMA);
  }, [updateTourPage, updateActiveTab]);

  useEffect(() => {
    let tourMountFrameId = 0;
    let cancelSearchCardWait: (() => void) | undefined;
    const cancelFeedWidgetWait = waitForTourFeedWidget(() => {
      // Give the pre-mounted Explore page a moment to render the mock search
      // cards before starting the tour. Without this, step 4 can activate
      // before the target card exists and render an empty spotlight.
      tourMountFrameId = window.setTimeout(() => {
        cancelSearchCardWait = waitForElement(TOUR_SEARCH_CARD_SELECTOR, () => {
          updateIsTourOpen(true);
          setIsTourReady(true);
        });
      }, TOUR_START_DELAY_MS);
    });

    return () => {
      cancelFeedWidgetWait();
      cancelSearchCardWait?.();
      window.clearTimeout(tourMountFrameId);
    };
  }, [updateIsTourOpen]);

  const isExplorePage = currentTourPage === CurrentTourPageType.EXPLORE_PAGE;
  // Pre-mount Explore (hidden) during the MyData phase so it stays mounted into
  // the Explore step — react-tour closes a step whose target is missing on
  // activation, and the redesigned Explore can't mount within its stepWaitTimer.
  const shouldRenderExplore =
    currentTourPage === CurrentTourPageType.MY_DATA_PAGE || isExplorePage;
  const exploreStyle = useMemo(
    () =>
      isExplorePage
        ? undefined
        : {
            pointerEvents: 'none',
            position: 'absolute',
            visibility: 'hidden',
          },
    [isExplorePage]
  );

  const currentPageComponent = useMemo(() => {
    return (
      <>
        {currentTourPage === CurrentTourPageType.MY_DATA_PAGE && <MyDataPage />}
        {shouldRenderExplore && (
          <div style={exploreStyle}>
            <ExplorePageV1Component pageTitle={t('label.explore')} />
          </div>
        )}
        {currentTourPage === CurrentTourPageType.DATASET_PAGE && (
          <TableDetailsPageV1 />
        )}
      </>
    );
  }, [currentTourPage, shouldRenderExplore, exploreStyle, t]);

  const tourSteps = useMemo(
    () =>
      getTourSteps({
        searchTerm: TOUR_SEARCH_TERM,
        clearSearchTerm,
        updateActiveTab,
        updateTourPage,
      }),
    [clearSearchTerm, updateActiveTab, updateTourPage]
  );

  // Rendered after the tour's page component so this Helmet wins: the tour
  // reuses My Data / Explore / table pages, whose own titles would otherwise
  // claim the tab.
  return (
    <>
      {currentPageComponent}
      <DocumentTitle title={t('label.tour')} />
      {isTourReady && <Tour steps={tourSteps} />}
    </>
  );
};

export default TourPage;
