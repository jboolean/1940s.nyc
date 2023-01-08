import React from 'react';

import classnames from 'classnames';

import { Link, useHistory, useParams } from 'react-router-dom';
import { Story } from 'screens/App/shared/types/Story';
import Grid from 'shared/components/Grid';
import StoryView from 'shared/components/Story';
import { getAllStories } from 'shared/utils/StoryApi';
import stylesheet from './AllStories.less';
import { PHOTO_BASE } from 'shared/utils/apiConstants';

const TARGET_WIDTH = 420;
const ASPECT = 420 / 630;

export default function Outtakes({
  className,
}: {
  className?: string;
}): JSX.Element {
  const [stories, setStories] = React.useState<Story[]>([]);

  React.useEffect(() => {
    void getAllStories().then((data) => {
      setStories(data);
    });
  }, []);

  const history = useHistory();
  const { identifier: selectedIdentifier } = useParams<{
    identifier?: string;
  }>();

  return (
    <div className={classnames(stylesheet.container, className)}>
      <div className={stylesheet.top}>
        <h1>All Stories</h1>
        <Link to="/map" className={stylesheet.backToMap}>
          Back to map
        </Link>
      </div>
      <div className={stylesheet.gridWrapper}>
        <Grid
          items={stories}
          targetWidth={TARGET_WIDTH}
          aspectRatio={ASPECT}
          className={stylesheet.grid}
          renderItem={(story) => {
            const identifier = story.photo;
            return (
              <div className={stylesheet.storyItem}>
                <div
                  className={classnames(stylesheet.storyCard, {
                    [stylesheet.selected]: identifier === selectedIdentifier,
                  })}
                  onClick={() => {
                    // visibleImageIRef.current = i;
                    history.push('/stories/photo/' + identifier);
                  }}
                >
                  <img
                    height={`100%`}
                    width={`100%`}
                    src={`${PHOTO_BASE}/420-jpg/${identifier}.jpg`}
                    loading="lazy"
                    className={classnames(stylesheet.image)}
                    onLoad={(e) => {
                      e.currentTarget.className += ' ' + stylesheet.loaded;
                    }}
                  />

                  <div className={stylesheet.textContent}>
                    <div className={stylesheet.storyTitle}>
                      {[
                        story.photoExpanded.address,
                        story.photoExpanded.borough,
                      ].join(', ')}
                    </div>
                    <div className={stylesheet.story}>
                      <StoryView story={story} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
