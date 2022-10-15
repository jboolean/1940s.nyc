import React from 'react';

import { FixedSizeList as List } from 'react-window';
import range from 'lodash/range';
import isNil from 'lodash/isNil';
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

function useForceUpdate(): () => void {
  const [, setValue] = React.useState(0); // integer state
  return () => setValue((value) => ++value); // update the state to force render
}

// This "state" is kept outside the component because AutoSizer unmounts the component when it is 0 width,
// and then it reloads data
const visibleImageIRef: { current?: number } = { current: undefined };
let photoSummaries: PhotoSummary[] = [];

function Grid({
  width,
  height,
}: {
  width: number;
  height: number;
}): JSX.Element {
  // Sorry this is a hack. State has to be stored outside the component but I still want to re-render.
  const forceUpdate = useForceUpdate();

  React.useEffect(() => {
    if (photoSummaries.length) return;
    void getOuttakeSummaries().then((data) => {
      photoSummaries = data;
      forceUpdate();
    });
  });

  const history = useHistory();
  const { identifier: selectedIdentifier } = useParams<{
    identifier?: string;
  }>();

  const listRef = React.createRef<List>();

  const itemsPerRow = calculateItemsPerRow(width);
  const itemHeight = (1 / ASPECT) * (width / itemsPerRow);

  // If items are reorganized, scroll to last visible item rather than some flying off somewhere random
  React.useEffect(() => {
    const imageI = visibleImageIRef.current;
    if (isNil(imageI)) return;
    const rowI = imageI / itemsPerRow;
    listRef.current?.scrollToItem(rowI, 'start');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- otherwise it will scroll on every click
  }, [itemsPerRow]);

  return (
    <List
      ref={listRef}
      width={width}
      height={height}
      itemSize={itemHeight}
      itemCount={Math.ceil(photoSummaries.length / itemsPerRow)}
      useIsScrolling
      className={stylesheet.grid}
      onItemsRendered={({ visibleStartIndex }) => {
        const imageI = visibleStartIndex * itemsPerRow;
        // We'll scroll back to here
        // Record on a delay to allow time for reflow
        setTimeout(() => {
          visibleImageIRef.current = imageI;
        }, 1500);
      }}
    >
      {({ index: rowIndex, style }) => {
        const firstPhotoIndex = rowIndex * itemsPerRow;
        return (
          <div style={style}>
            {range(
              firstPhotoIndex,
              Math.min(firstPhotoIndex + itemsPerRow, photoSummaries.length)
            ).map((i) => {
              const { identifier } = photoSummaries[i];
              return (
                <img
                  key={identifier}
                  height={itemHeight}
                  width={`${100 / itemsPerRow}%`}
                  src={`https://photos.1940s.nyc/420-jpg/${identifier}.jpg`}
                  loading="lazy"
                  className={classnames(stylesheet.image, {
                    [stylesheet.selected]: identifier === selectedIdentifier,
                  })}
                  onLoad={(e) => {
                    e.currentTarget.className += ' ' + stylesheet.loaded;
                  }}
                  onClick={() => {
                    visibleImageIRef.current = i;
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
