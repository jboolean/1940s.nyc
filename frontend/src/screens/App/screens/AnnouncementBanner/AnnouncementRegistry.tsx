import React from 'react';
import Announcment from './Announcement';

const ANNOUNCEMENTS_REGISTRY: Announcment[] = [
  {
    id: 'maintainance-2024-12-30',
    expiresAt: new Date('2024-12-31'),
    render: () => (
      <React.Fragment>
        🛠 I&apos;m performing maintenance. Some functions may not work. Come
        back soon.
      </React.Fragment>
    ),
  },
  {
    id: 'zoom',
    expiresAt: new Date('2025-01-31'),
    render: () => (
      <React.Fragment>
        🔍 What&rsquo;s that sign say? Is that mom? <b>New</b>: zoom in and find
        out.
      </React.Fragment>
    ),
  },
  {
    id: 'high-quality-imagery',
    expiresAt: new Date('2024-09-05'),
    render: () => {
      return (
        <React.Fragment>
          <b>🎉 New:</b> Now with higher quality 1940s images
        </React.Fragment>
      );
    },
  },
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
