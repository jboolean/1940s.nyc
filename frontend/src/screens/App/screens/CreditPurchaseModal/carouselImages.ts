import { PHOTO_BASE } from 'shared/utils/apiConstants';

export default [
  // Plaza hotel
  {
    identifier: 'nynyma_rec0040_1_01274_0025',
    objectPosition: 'center 75%',
    alt: 'Plaza hotel',
  },
  // Girl
  {
    identifier: 'nynyma_rec0040_1_E-1262_02',
    objectPosition: 'center 75%',
    alt: 'Little girl on the street in front of black car and brick buildings',
  },
  // Alley with sunlight
  {
    identifier: 'nynyma_rec0040_1_00069_0039b',
    objectPosition: 'center bottom',
    alt: 'Alleyway in the Financial District, with scattered sunlight',
  },
  // Green lawn
  {
    identifier: 'nynyma_rec0040_2_03256_0018',
    objectPosition: 'right 25%',
    alt: 'Man holding sign in front of house with conical roof',
  },
  // Kids
  {
    identifier: 'nynyma_rec0040_3_01892_0027',
    objectPosition: 'center 70%',
  },
  // Mom and boy at fence
  {
    identifier: 'nynyma_rec0040_4_T-5761A_19',
    objectPosition: 'left 80%',
    alt: 'Woman and boy at fence',
  },
  // Fulton mall
  {
    identifier: 'nynyma_rec0040_3_00150_0006',
    objectPosition: '50% 70%',
    alt: 'Fulton mall',
  },
  // Black boy
  {
    identifier: 'nynyma_rec0040_3_N-4173_03',
    objectPosition: 'center center',
    alt: 'boy in front of armory',
  },
  // Brownstones
  {
    identifier: 'nynyma_rec0040_1_01559_0018',
    objectPosition: '50% 60%',
    alt: 'Brownstones',
  },
].map((image) => ({
  ...image,
  src: `${PHOTO_BASE}/colorized/${image.identifier}.jpg`,
}));
