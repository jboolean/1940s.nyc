import * as overlays from './overlays';

export interface MapInterface {
  goTo(center: { lng: number; lat: number } | [number, number]): void;
  resize(): void;
}

export interface MapProps {
  className?: string;
  panOnClick: boolean;
  overlay: overlays.OverlayId;
}
