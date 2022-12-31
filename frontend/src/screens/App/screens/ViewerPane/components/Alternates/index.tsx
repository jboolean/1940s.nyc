import React from 'react';
import { Link } from 'react-router-dom';
import stylesheet from './Alternates.less';
import { getAlternatePhotos, PhotoSummary } from 'shared/utils/photosApi';
import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { PHOTO_BASE } from 'shared/utils/apiConstants';

const COLLECTION_DISPLAY_NAMES: Record<PhotoSummary['collection'], string> = {
  '1940': '40s',
  '1980': '80s',
};

export default function Alternates({
  className,
  originalIdentifier,
}: {
  className?: string;
  originalIdentifier: string;
}): JSX.Element | null {
  const [alternatePhotos, setAlternatePhotos] = React.useState<PhotoSummary[]>(
    []
  );

  React.useEffect(() => {
    // setAlternatePhotos([]);
    void getAlternatePhotos(originalIdentifier).then(setAlternatePhotos);
  }, [originalIdentifier]);

  return (
    <CSSTransition
      in={alternatePhotos.length > 1}
      classNames={{ ...stylesheet }}
      appear
      timeout={{
        appear: 150,
        enter: 150,
        exit: 0,
      }}
    >
      <div
        className={classnames(stylesheet.container, className)}
        title="Alternate photos at this location"
      >
        <div className={classnames(stylesheet.filmstrip)}>
          {alternatePhotos.map(({ identifier, collection }) => (
            <Link to={identifier} key={identifier} className={stylesheet.link}>
              <span className={stylesheet.collectionTag}>
                {COLLECTION_DISPLAY_NAMES[collection]}
              </span>
              <img
                src={`${PHOTO_BASE}/420-jpg/${identifier}.jpg`}
                className={classnames(stylesheet.thumbnail, {
                  [stylesheet.selected]: identifier === originalIdentifier,
                })}
              />
            </Link>
          ))}
        </div>
      </div>
    </CSSTransition>
  );
}
