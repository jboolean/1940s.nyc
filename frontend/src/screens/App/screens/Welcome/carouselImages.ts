export default [
  // Plaza hotel
  {
    identifier: 'nynyma_rec0040_1_01274_0025',
    objectPosition: 'center 75%',
  },
  // Fulton mall
  {
    identifier: 'nynyma_rec0040_3_00150_0006',
    objectPosition: '50% 70%',
  },
  // Stoop kids
  {
    identifier: 'nynyma_rec0040_3_00083_0020',
    objectPosition: '60% 60%',
  },
  // Black boy
  {
    identifier: 'nynyma_rec0040_3_N-4173_03',
    objectPosition: 'center center',
  },
  // Brownstones
  {
    identifier: 'nynyma_rec0040_1_01559_0018',
    objectPosition: '50% 60%',
  },
  // Theater
  {
    identifier: 'nynyma_rec0040_1_I-2490_34',
    objectPosition: '75% 75%',
  },
  // Words fair
  {
    identifier: 'nynyma_rec0040_1_00998_0063',
    objectPosition: '70% 50%',
  },
  // Grand st
  {
    identifier: 'nynyma_rec0040_1_00239_0020',
    objectPosition: '42.857% bottom',
  },
  // Group of men
  {
    identifier: 'nynyma_rec0040_1_00554_0001',
    objectPosition: '16.627% 57.023%',
  },
  // Penn. R.R. Sta.
  {
    identifier: 'nynyma_rec0040_1_01280_0001',
    objectPosition: '55.000% 61.786%',
  },
  // Tax man
  {
    identifier: 'nynyma_rec0040_1_F-1690_37',
    objectPosition: '60% 40%',
  },
].map(image => ({
  ...image,
  src: `https://photos.1940s.nyc/jpg/${image.identifier}.jpg`,
}));
