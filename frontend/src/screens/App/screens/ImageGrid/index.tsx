import React from 'react';

import { FixedSizeList as List } from 'react-window';
import range from 'lodash/range';
import findIndex from 'lodash/findIndex';
import classnames from 'classnames';

import AutoSizer from 'react-virtualized-auto-sizer';

import { PhotoSummary, getOuttakeSummaries } from 'shared/utils/photosApi';

import stylesheet from './ImageGrid.less';
import { useHistory, useParams, Link } from 'react-router-dom';

const TARGET_IMAGE_WIDTH = 420 / 4;
const ASPECT = 420 / 630;

const calculateItemsPerRow = (width: number): number => {
  const itemsPerRow = Math.floor(width / TARGET_IMAGE_WIDTH);
  const freeSpace = width - itemsPerRow * TARGET_IMAGE_WIDTH;

  // It would be closer to the target to add an extra item
  if (freeSpace > TARGET_IMAGE_WIDTH / 2) {
    return itemsPerRow + 1;
  }

  return itemsPerRow;
};

// Return null instead of url if is scolling and has not seen this url before
// Prevent loading lots of images during scrolling
const loadedUrls = new Set<string>();
const onlyIfLoaded = (url: string, isScrolling: boolean): string => {
  if (isScrolling && !loadedUrls.has(url)) {
    return null;
  }
  loadedUrls.add(url);
  return url;
};

function Grid({
  width,
  height,
}: {
  width: number;
  height: number;
}): JSX.Element {
  const [photoSummaries, setPhotoSummaries] = React.useState<PhotoSummary[]>(
    []
  );

  React.useEffect(() => {
    getOuttakeSummaries().then(setPhotoSummaries);
  }, []);

  const history = useHistory();
  const { identifier: selectedIdentifier } = useParams();

  const listRef = React.createRef<List>();

  const itemsPerRow = calculateItemsPerRow(width);
  const itemHeight = (1 / ASPECT) * (width / itemsPerRow);

  // Scroll to selected item
  React.useEffect(() => {
    if (!selectedIdentifier) return;
    const imageI = findIndex(photoSummaries, {
      identifier: selectedIdentifier,
    });
    const rowI = imageI / itemsPerRow;
    listRef.current.scrollToItem(rowI);
  }, [selectedIdentifier, photoSummaries, width, height]);

  return (
    <List
      ref={listRef}
      width={width}
      height={height}
      itemSize={itemHeight}
      itemCount={Math.ceil(photoSummaries.length / itemsPerRow)}
      useIsScrolling
      className={stylesheet.grid}
    >
      {({ index: rowIndex, style, isScrolling }) => {
        const firstPhotoIndex = rowIndex * itemsPerRow;
        return (
          <div style={style}>
            {range(
              firstPhotoIndex,
              Math.min(firstPhotoIndex + itemsPerRow, photoSummaries.length)
            ).map(i => {
              const { identifier } = photoSummaries[i];
              return (
                <img
                  key={identifier}
                  height={itemHeight}
                  width={`${100 / itemsPerRow}%`}
                  src={onlyIfLoaded(
                    `https://photos.1940s.nyc/420-jpg/${identifier}.jpg`,
                    isScrolling
                  )}
                  loading="lazy"
                  className={classnames(stylesheet.image, {
                    [stylesheet.selected]: identifier === selectedIdentifier,
                  })}
                  onLoad={e => {
                    e.currentTarget.className += ' ' + stylesheet.loaded;
                  }}
                  onClick={() => {
                    history.push('/outtakes/photo/' + identifier);
                  }}
                />
              );
            })}
          </div>
        );
      }}
    </List>
  );
}

export default function Outtakes({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <div className={classnames(stylesheet.container, className)}>
      <div className={stylesheet.top}>
        <h1>Outtakes</h1>
        <Link to="/map" className={stylesheet.backToMap}>
          Back to map
        </Link>
      </div>
      <div className={stylesheet.gridWrapper}>
        <AutoSizer>
          {({ width, height }) => <Grid width={width} height={height} />}
        </AutoSizer>
      </div>
    </div>
  );
}
