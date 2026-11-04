interface Announcment {
  id: string;
  expiresAt: Date;
  render: () => React.ReactNode;
}

export default Announcment;
