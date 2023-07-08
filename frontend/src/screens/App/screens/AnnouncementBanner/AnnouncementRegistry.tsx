import React from 'react';
import useFeatureFlagStore from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import Announcment from './Announcement';

const ANNOUNCEMENTS_REGISTRY: Announcment[] = [
  {
    id: 'storytelling-launch-2',
    expiresAt: new Date('2023-04-21'),
    render: () => (
      <React.Fragment>
        <b>New:</b> Click <i>Know This Place?</i> on any photo to contribute
        your knowledge and stories. (fixed!)
      </React.Fragment>
    ),
  },
  {
    id: 'call-for-help',
    expiresAt: new Date('2023-02-01'),
    render: () => (
      <React.Fragment>
        Are you a frontend or fullstack engineer? Seeking a volunteer to help
        with <i>1940s.nyc</i>. <a href="mailto:julian@1940s.nyc">Contact me</a>
      </React.Fragment>
    ),
  },
  {
    id: 'colorization',
    expiresAt: new Date('2023-10-04'),
    render: () => (
      <React.Fragment>
        <b>🌈 New:</b> Bring photos to life with the AI-powered <i>Colorize</i>{' '}
        button
      </React.Fragment>
    ),
  },
];

export default ANNOUNCEMENTS_REGISTRY;
