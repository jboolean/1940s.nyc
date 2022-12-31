import React from 'react';
import { getStoriesForPhoto } from 'shared/utils/StoryApi';
import { Story as StoryType } from 'screens/App/shared/types/Story';
import Story from 'shared/components/Story';

interface Props {
  photoIdentifier: string;
}

export default function Stories({ photoIdentifier }: Props): JSX.Element {
  const [stories, setStories] = React.useState<StoryType[]>([]);

  React.useEffect(() => {
    getStoriesForPhoto(photoIdentifier)
      .then((stories) => {
        setStories(stories);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [photoIdentifier]);

  return (
    <div>
      {stories.map((story) => (
        <Story key={story.id} story={story} />
      ))}
    </div>
  );
}
