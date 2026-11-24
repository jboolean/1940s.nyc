const corsOrigins: (string | RegExp)[] = [
  'http://dev.1940s.nyc:8080',
  'http://localhost:8080',
  'https://1940s.nyc',
  /^https:\/\/[a-z0-9-]+--1940s-nyc\.netlify\.app$/,
];

export default corsOrigins;
