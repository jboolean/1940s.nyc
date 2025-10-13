import React from 'react';

import classnames from 'classnames';

import { getOuttakeSummaries, PhotoSummary } from 'shared/utils/photosApi';

import { Link, useNavigate, useParams } from 'react-router-dom';
import Grid from 'shared/components/Grid';
import Paginated from 'shared/types/Paginated';
import { PHOTO_BASE } from 'shared/utils/apiConstants';
import stylesheet from './Outtakes.less';

const TARGET_IMAGE_WIDTH = 420 / 4;
const ASPECT = 420 / 630;

export default function Outtakes({
  className,
}: {
  className?: string;
}): JSX.Element {
  const nextToken = React.useRef<string>(undefined);
  const [photoSummariesPage, setPhotoSummariesPage] =
    React.useState<Paginated<PhotoSummary> | null>(null);
  const [photoSummaries, setPhotoSummaries] = React.useState<PhotoSummary[]>(
    []
  );
  const isLoading = React.useRef(false);

  const handleNewPage = React.useCallback(
    (newPage: Paginated<PhotoSummary>): void => {
      nextToken.current = newPage.nextToken;
      setPhotoSummariesPage(newPage);
      setPhotoSummaries([...photoSummaries, ...newPage.items]);
    },
    [photoSummaries]
  );

  React.useEffect(
    () => {
      isLoading.current = true;
      void getOuttakeSummaries(500)
        .then(handleNewPage)
        .finally(() => {
          isLoading.current = false;
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const loadNextPage = React.useCallback(
    async (pageSize: number) => {
      if (!photoSummariesPage) return;
      if (!photoSummariesPage.hasNextPage) return;
      if (isLoading.current) {
        return;
      }

      isLoading.current = true;

      return getOuttakeSummaries(Math.max(pageSize, 500), nextToken.current)
        .then((data) => handleNewPage(data))
        .finally(() => {
          isLoading.current = false;
        });
    },
    [photoSummariesPage, handleNewPage]
  );

  const handleLoadMoreItems = React.useCallback(
    (untilIndex: number) => {
      return loadNextPage(untilIndex - photoSummaries.length + 1);
    },
    [photoSummaries, loadNextPage]
  );

  const navigate = useNavigate();
  const { identifier: selectedIdentifier } = useParams<{
    identifier?: string;
  }>();

  return (
    <div className={classnames(stylesheet.container, className)}>
      <div className={stylesheet.top}>
        <h1>Outtakes</h1>
        <Link to="/map" className={stylesheet.backToMap}>
          Back to map
        </Link>
      </div>
      <div className={stylesheet.gridWrapper}>
        <Grid
          items={photoSummaries}
          targetWidth={TARGET_IMAGE_WIDTH}
          aspectRatio={ASPECT}
          className={stylesheet.grid}
          totalItems={photoSummariesPage?.total ?? 0}
          loadMoreItems={handleLoadMoreItems}
          renderItem={(photoSummary) => {
            if (!photoSummary) return null;
            const { identifier } = photoSummary;
            return (
              <img
                key={identifier}
                height={`100%`}
                width={`100%`}
                src={`${PHOTO_BASE}/420-jpg/${identifier}.jpg`}
                loading="lazy"
                className={classnames(stylesheet.image, {
                  [stylesheet.selected]: identifier === selectedIdentifier,
                })}
                onLoad={(e) => {
                  e.currentTarget.className += ' ' + stylesheet.loaded;
                }}
                onClick={() => {
                  // visibleImageIRef.current = i;
                  navigate('/outtakes/photo/' + identifier);
                }}
              />
            );
          }}
        />
      </div>
    </div>
  );
}
