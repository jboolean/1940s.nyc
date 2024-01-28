import React from 'react';
import { Story as StoryType } from 'screens/App/shared/types/Story';
import Story from 'shared/components/Story';
import { getStoriesForPhoto } from 'shared/utils/StoryApi';

interface Props {
  photoIdentifier: string;
}

export default function Stories({ photoIdentifier }: Props): JSX.Element {
  const [stories, setStories] = React.useState<StoryType[]>([]);

  React.useEffect(() => {
    getStoriesForPhoto(photoIdentifier)
      .then((stories) => {
        // TODO handle pagination
        setStories(stories.items);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [photoIdentifier]);

  return (
    <div title="Stories">
      {stories.map((story) => (
        <Story key={story.id} story={story} />
      ))}
    </div>
  );
}
