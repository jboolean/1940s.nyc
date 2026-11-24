import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { makePrintfulItem } from './PrintfulItemBuildService';

function layerUrl(printfileToken: string | null): string | undefined {
  return makePrintfulItem({
    id: 3,
    printfileToken,
    internalVariant: MerchInternalVariant.TOTE_BAG_SMALL,
  }).placements?.[0].layers[0].url;
}

it('sends the print file at the key the renderer wrote', () => {
  expect(layerUrl('abc')).toBe(
    'https://photos.1940s.nyc/merch/printfiles-dev/3-abc.png'
  );
});

it('sends an item rendered before tokens at its old key', () => {
  expect(layerUrl(null)).toBe(
    'https://photos.1940s.nyc/merch/printfiles-dev/3.png'
  );
});
