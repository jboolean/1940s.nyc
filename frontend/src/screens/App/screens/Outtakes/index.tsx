import React from 'react';

import classnames from 'classnames';

import { getOuttakeSummaries, PhotoSummary } from 'shared/utils/photosApi';

import { Link, useHistory, useParams } from 'react-router-dom';
import Grid from 'shared/components/Grid';
import { PHOTO_BASE } from 'shared/utils/apiConstants';
import stylesheet from './Outtakes.less';

const TARGET_IMAGE_WIDTH = 420 / 4;
const ASPECT = 420 / 630;

export default function Outtakes({
  className,
}: {
  className?: string;
}): JSX.Element {
  const [photoSummaries, setPhotoSummaries] = React.useState<PhotoSummary[]>(
    []
  );

  React.useEffect(() => {
    void getOuttakeSummaries().then((data) => {
      setPhotoSummaries(data);
    });
  }, []);

  const history = useHistory();
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
          totalItems={photoSummaries.length}
          loadMoreItems={() => Promise.resolve()}
          renderItem={(photoSummary) => {
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
                  history.push('/outtakes/photo/' + identifier);
                }}
              />
            );
          }}
        />
      </div>
    </div>
  );
}
