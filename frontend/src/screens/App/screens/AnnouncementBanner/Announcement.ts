import FeatureFlag from '../../shared/types/FeatureFlag';

interface Announcment {
  id: string;
  expiresAt: Date;
  requiresFlag?: FeatureFlag;
  render: () => React.ReactNode;
}

export default Announcment;
