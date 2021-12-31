import React from 'react';
import { Link } from 'react-router-dom';
import stylesheet from './Alternates.less';
import { getAlternatePhotos, PhotoSummary } from 'shared/utils/photosApi';
import classnames from 'classnames';

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
    getAlternatePhotos(originalIdentifier).then(setAlternatePhotos);
  }, [originalIdentifier]);

  if (alternatePhotos.length <= 1) {
    return null;
  }

  return (
    <div className={classnames(stylesheet.container, className)}>
      <div className={classnames(stylesheet.filmstrip)}>
        {alternatePhotos.map(({ identifier, collection }) => (
          <Link to={identifier} key={identifier} className={stylesheet.link}>
            <span className={stylesheet.collectionTag}>
              {COLLECTION_DISPLAY_NAMES[collection]}
            </span>
            <img
              src={`https://photos.1940s.nyc/420-jpg/${identifier}.jpg`}
              className={classnames(stylesheet.thumbnail, {
                [stylesheet.selected]: identifier === originalIdentifier,
              })}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
