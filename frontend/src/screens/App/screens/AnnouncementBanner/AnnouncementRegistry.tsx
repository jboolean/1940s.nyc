import React from 'react';
import Announcment from './Announcement';

const ANNOUNCEMENTS_REGISTRY: Announcment[] = [
  {
    id: 'announcement-1',
    expiresAt: new Date('2024-01-01'),
    render: () => <React.Fragment>Announcement 1</React.Fragment>,
  },
  {
    id: 'announcement-2',
    expiresAt: new Date('2024-01-01'),
    render: () => <React.Fragment>Announcement 2</React.Fragment>,
  },
];

export default ANNOUNCEMENTS_REGISTRY;
