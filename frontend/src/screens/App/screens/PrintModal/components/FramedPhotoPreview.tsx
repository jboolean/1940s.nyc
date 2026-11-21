import React from 'react';
import classnames from 'classnames';

import galleryFineBlackMoulding from './assets/frame-moulding-gallery-fine-black.jpg';
import stylesheet from './FramedPhotoPreview.less';

// WHCC's texture for each moulding id, copied from the strips its ordering site draws frames with.
const MOULDING_TEXTURES: Record<string, string> = {
  gallery_fine_black: galleryFineBlackMoulding,
};

// The moulding images are horizontal strips 895 wide for every 36 tall.
const MOULDING_ASPECT = 895 / 36;

// The face of the moulding on each side.
const MOULDING_WIDTH_INCHES = 3 / 4;

// How far the frame's lip reaches over the edge of the print on each side. WHCC frames an 8×12
// print at 9⅛ × 13⅛ outside, so a ¾ face reaches 9/16 past the print and covers the last 3/16 of it.
const MOULDING_LIP_INCHES = 3 / 16;

type Side = 'top' | 'right' | 'bottom' | 'left';

// Each side is the same strip turned so its outer edge faces outwards. The background offsets
// differ so the four sides do not show the same stretch of wood grain.
const SIDES: { side: Side; rotation: number; backgroundX: string }[] = [
  { side: 'top', rotation: 0, backgroundX: '82%' },
  { side: 'right', rotation: 90, backgroundX: '27%' },
  { side: 'bottom', rotation: 180, backgroundX: '61%' },
  { side: 'left', rotation: -90, backgroundX: '9%' },
];

interface Size {
  width: number;
  height: number;
}

function sideStyle(
  texture: string,
  side: Side,
  rotation: number,
  backgroundX: string,
  outer: Size,
  face: number
): React.CSSProperties {
  const isVertical = side === 'left' || side === 'right';
  const length = isVertical ? outer.height : outer.width;

  // Laid out horizontally with its centre where the side's centre goes, then turned in place.
  const centreX =
    side === 'left'
      ? face / 2
      : side === 'right'
      ? outer.width - face / 2
      : outer.width / 2;
  const centreY =
    side === 'top'
      ? face / 2
      : side === 'bottom'
      ? outer.height - face / 2
      : outer.height / 2;

  return {
    width: length,
    height: face,
    left: centreX - length / 2,
    top: centreY - face / 2,
    transform: `rotate(${rotation}deg)`,
    backgroundImage: `url(${texture})`,
    backgroundSize: `${face * MOULDING_ASPECT}px ${face}px`,
    backgroundPosition: `${backgroundX} 0%`,
    // A trapezoid whose 45° ends meet the neighbouring sides at the corners.
    clipPath: `polygon(0px 0px, ${length}px 0px, ${
      length - face
    }px ${face}px, ${face}px ${face}px)`,
  };
}

interface Props {
  // WHCC's moulding id, such as gallery_fine_black.
  moulding: string;
  // The real size of the print, so the print and its frame are drawn to scale.
  printShortSideInches: number;
  printLongSideInches: number;
  src: string;
  alt: string;
  className?: string;
  imgTestId?: string;
}

function Frame({
  texture,
  printShortSideInches,
  printLongSideInches,
  src,
  alt,
  className,
  imgTestId,
  onError,
}: Omit<Props, 'moulding'> & {
  texture: string;
  onError: () => void;
}): React.JSX.Element {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = React.useState(0);
  // Width over height of the photo, known once it loads. Kept with its source so a new photo is not
  // drawn with the last one's shape.
  const [loaded, setLoaded] = React.useState<{
    src: string;
    aspect: number;
  } | null>(null);
  const aspect = loaded?.src === src ? loaded.aspect : null;

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) =>
      setStageWidth(entry.contentRect.width)
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const faceToShortSide = MOULDING_WIDTH_INCHES / printShortSideInches;
  const borderToShortSide =
    (MOULDING_WIDTH_INCHES - MOULDING_LIP_INCHES) / printShortSideInches;
  const longOverShort = printLongSideInches / printShortSideInches;

  // Sizes are worked out from the stage width rather than measured, since the frame is sized from
  // the print and the print from the space left inside the frame.
  const uprightShortSide = stageWidth / (1 + 2 * borderToShortSide);

  // The print is drawn whole, turned to match the photo with a square photo upright, and the frame
  // goes on top of its edges. WHCC crops the photo to fill the print from the centre, so the
  // preview does the same.
  let print: Size | null = null;
  let outer: Size | null = null;
  let border = 0;
  let face = 0;
  if (stageWidth > 0 && aspect) {
    if (aspect <= 1) {
      print = {
        width: uprightShortSide,
        height: uprightShortSide * longOverShort,
      };
    } else {
      const shortSide = stageWidth / (longOverShort + 2 * borderToShortSide);
      print = { width: shortSide * longOverShort, height: shortSide };
    }
    const printShortSide = Math.min(print.width, print.height);
    border = printShortSide * borderToShortSide;
    face = printShortSide * faceToShortSide;
    outer = {
      width: print.width + 2 * border,
      height: print.height + 2 * border,
    };
  }

  return (
    <div ref={stageRef} className={className}>
      <div
        className={classnames(stylesheet.container, {
          [stylesheet.unmeasured]: !print,
        })}
        style={
          print
            ? { width: print.width, height: print.height, padding: border }
            : undefined
        }
        data-testid="framed-photo-preview"
      >
        <img
          src={src}
          alt={alt}
          className={stylesheet.photo}
          data-testid={imgTestId}
          onLoad={(e) =>
            setLoaded({
              src,
              aspect:
                e.currentTarget.naturalWidth / e.currentTarget.naturalHeight,
            })
          }
          onError={onError}
        />
        {outer &&
          SIDES.map(({ side, rotation, backgroundX }) => (
            <div
              key={side}
              className={stylesheet.side}
              data-testid={`framed-photo-side-${side}`}
              style={sideStyle(
                texture,
                side,
                rotation,
                backgroundX,
                outer,
                face
              )}
            >
              <div
                className={stylesheet.miterSeam}
                style={{
                  left:
                    (side === 'left' || side === 'right'
                      ? outer.height
                      : outer.width) -
                    face -
                    1,
                  width: face,
                  height: face,
                }}
              />
            </div>
          ))}
      </div>
    </div>
  );
}

// Shows a photo inside a WHCC frame, drawn the way WHCC's ordering site draws it. A moulding with no
// texture here, or a photo that fails to load, shows the plain photo, so the browser's broken image
// and alt text appear instead of an empty frame.
export default function FramedPhotoPreview({
  moulding,
  ...props
}: Props): React.JSX.Element {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const texture = MOULDING_TEXTURES[moulding];
  if (!texture || failedSrc === props.src) {
    return (
      <img
        src={props.src}
        alt={props.alt}
        className={props.className}
        data-testid={props.imgTestId}
      />
    );
  }
  return (
    <Frame
      texture={texture}
      onError={() => setFailedSrc(props.src)}
      {...props}
    />
  );
}
