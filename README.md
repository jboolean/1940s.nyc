# 1940s.nyc

1940 New York City Street View

This is a monorepo. See the README in each submodule for more information. `npm install` at the root level can be used to install all submodule dependencies.

## backend

The serverless API for search, photo metadata, and payments.
Also, s3 event lambdas used for processing images as part of ingesting from the initial photo scrape.

![backend deploy](https://github.com/jboolean/1940s.nyc/actions/workflows/backend-deploy.yml/badge.svg)

## frontend

The frontend, a React app.

[![Netlify Status](https://api.netlify.com/api/v1/badges/29e76d8d-f9ba-4afa-bc07-c89fc03e570a/deploy-status)](https://app.netlify.com/sites/1940s-nyc/deploys)
