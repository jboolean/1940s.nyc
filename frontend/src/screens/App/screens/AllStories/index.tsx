import React from 'react';

import classnames from 'classnames';

import { Link } from 'react-router-dom';
import { Story } from 'screens/App/shared/types/Story';
import Grid from 'shared/components/Grid';
import StoryView from 'shared/components/Story';
import { getAllStories } from 'shared/utils/StoryApi';
import stylesheet from './AllStories.less';

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

  // const history = useHistory();
  // const { identifier: selectedIdentifier } = useParams<{
  //   identifier?: string;
  // }>();

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
            return (
              <div className={stylesheet.storyItem}>
                <div className={stylesheet.storyCard}>
                  <div className={stylesheet.storyTitle}>
                    {[
                      story.photoExpanded.address,
                      story.photoExpanded.borough,
                    ].join(', ')}
                  </div>
                  <StoryView story={story} />
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
