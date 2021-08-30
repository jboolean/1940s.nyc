# 1940s.nyc
1940 New York City Street View


This is a monorepo containing these modules:

## backend
The serverless API for search, photo metadata, and payments. 
Also, s3 event lambdas used for processing images as part of ingesting from the initial photo scrape.

## frontend
The frontend, a React app.

## edge (no longer used)
Lambda@Edge functions to compress map tiles from mapwarper (serving the historic map layer) to webp. 
Used briefly to protect mapwarper from getting overloaded, but no longer in use.
