import React from 'react';
import Announcment from './Announcement';

const ANNOUNCEMENTS_REGISTRY: Announcment[] = [
  {
    id: 'storytelling-launch',
    expiresAt: new Date('2023-04-07'),
    render: () => (
      <React.Fragment>
        <b>New:</b> Click <i>Know This Place?</i> on any photo to contribute
        your knowledge and stories.
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
];

export default ANNOUNCEMENTS_REGISTRY;
