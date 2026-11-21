import classnames from 'classnames';
import React from 'react';
import { API_BASE } from 'utils/apiConstants';

import ExternalIcon from 'shared/components/ExternalIcon';
import recordEvent from 'shared/utils/recordEvent';
import { ORDER_PRINT_EXTERNAL_LINK_MESSAGE } from '../archivesLink';
import stylesheet from './ArchivesCard.less';

export default function ArchivesCard({
  photoIdentifier,
  isOnlyOption,
  className,
}: {
  photoIdentifier: string;
  // True for 1980s photos, which can only be ordered from the Municipal Archives.
  isOnlyOption: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <a
      className={classnames(stylesheet.archivesCard, className)}
      href={`${API_BASE}/photos/${photoIdentifier}/buy-prints`}
      target="_blank"
      rel="noreferrer"
      data-testid="archives-card"
      onClick={() => {
        recordEvent({
          category: 'Image Viewer',
          action: 'Clicks Order Print From Archives',
        });
        alert(ORDER_PRINT_EXTERNAL_LINK_MESSAGE);
        return true;
      }}
    >
      {!isOnlyOption && (
        <div className={stylesheet.archivesLabel}>Alternative</div>
      )}
      <div className={stylesheet.archivesTitle}>
        Order from the Municipal Archives <ExternalIcon />
        <span className={stylesheet.visuallyHidden}>(opens in a new tab)</span>
      </div>
      <div>
        Click here to order directly from the Archives instead of from{' '}
        <i>1940s.nyc</i>.{' '}
        {isOnlyOption && (
          <>
            Photos from the 1980s collection are only available from the
            Municipal Archives.{' '}
          </>
        )}
        <>
          Prints are made from a scan of the original negative on heavyweight
          luster inkjet paper. Fulfillment time is three to six weeks, but may
          vary.{' '}
        </>
        <>
          <i>1940s.nyc</i> is not affiliated with the Municipal Archives and
          cannot help with orders placed directly from the Municipal Archives.
        </>
      </div>
    </a>
  );
}
