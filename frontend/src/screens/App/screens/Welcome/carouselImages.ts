export default [
  // Plaza hotel
  {
    identifier: 'nynyma_rec0040_1_01274_0025',
    objectPosition: 'center 75%',
    alt: 'Plaza hotel',
  },
  // Fulton mall
  {
    identifier: 'nynyma_rec0040_3_00150_0006',
    objectPosition: '50% 70%',
    alt: 'Fulton mall',
  },
  // Stoop kids
  {
    identifier: 'nynyma_rec0040_3_00083_0020',
    objectPosition: '60% 60%',
    alt: 'Children on stoop',
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
  // Theater
  {
    identifier: 'nynyma_rec0040_1_I-2490_34',
    objectPosition: '75% 75%',
    alt: 'Woman walking by theater',
  },
  // Words fair
  {
    identifier: 'nynyma_rec0040_1_00998_0063',
    objectPosition: '70% 50%',
    alt: 'Times Square',
  },
  // Grand st
  {
    identifier: 'nynyma_rec0040_1_00239_0020',
    objectPosition: '42.857% bottom',
    alt: 'Man bowing at grant st',
  },
  // Group of men
  {
    identifier: 'nynyma_rec0040_1_00554_0001',
    objectPosition: '16.627% 57.023%',
    alt: 'group of men in the distance',
  },
  // Penn. R.R. Sta.
  {
    identifier: 'nynyma_rec0040_1_01280_0001',
    objectPosition: '55.000% 61.786%',
    alt: 'Pennsylvania Rail Road Station',
  },
  // Tax man
  {
    identifier: 'nynyma_rec0040_1_F-1690_37',
    objectPosition: '60% 40%',
    alt: 'Tax man',
  },
].map((image) => ({
  ...image,
  src: `https://photos.1940s.nyc/jpg/${image.identifier}.jpg`,
}));
