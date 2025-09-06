# 1940s.nyc backend

This is a serverless app deployed to AWS lambda. It is written in Node.js and uses the Serverless framework.

## Pre-requisites

### Credentials

First, have AWS credentials on your machine in [a way the serverless framework can use](https://www.serverless.com/framework/docs/providers/aws/guide/credentials#recommended-using-local-credentials) such as in `~/.aws`. These credentials are used to fetch secrets via SSM to connect to the database and other services.

### Node.js

This project was developed with node version specified in in .nvmrc

With `nvm` installed, run `nvm use`

## Development

When building for the first time or if dependencies have changed, run

```
npm install
```

To develop,

```
npm start
```

## Environments

There are three backend environments (stages), two database environments, unlimited frontend environments, and one Maplibre map.

On the backend, there's production, staging, and your local development environment. Production uses the `fourtiesnyc` database, while other environments use `fourtiesnyc_staging`. This means your local server uses a shared database with staging. This is not ideal and came about because originally the app had only static photo data; it should be improved.

On the frontend, there are ephemeral environments created for each pull request, these all share `staging` as the backend.

There is one Maplibre map that is shared. This means you may see story labels on the map that are not in the staging database and can't be read.

## Deployment

Deployment should _not_ be done from your local machine, but only by Github Actions.

Deployments to production are automated upon merges to `master`.

To deploy to staging, use the [backend-deploy-manual](https://github.com/jboolean/1940s.nyc/actions/workflows/backend-deploy-manual.yml) action and select stage=staging.

## Schema changes

There is no schema change management. Schema changes and migrations are made manually and carefully. It's suggested to try out your schema changes in staging, then create a DDL of the final schema and apply it to production.

Ideally, either TypeORM migrations or something like [Flyway](https://flywaydb.org/) would be used to manage schema changes.

Use the [clone-db](https://github.com/jboolean/1940s.nyc/actions/workflows/clone-db.yml) Action to clone production back to staging if staging becomes too outdated or broken and needs to be reset.

## Frameworks and patterns

### Serverless

Serverless framework is used to manage packaging and deployment.

### Express

Express is used, but most routes are defined with the `tsoa` framework.

### tsoa

The [tsoa](https://github.com/lukeautry/tsoa) API framework is used to define a REST API with type safety and OpenAPI spec generation. `*Controller` classes are scanned, annotations are parsed, and routes are generated. It also validates requests and can return validation messages to the client.

Use `npm run routes` to regenerate the routes file.

### TypeORM

TypeORM is used as a typed ORM. It's used to interact with the database.

### Directory structure

The classic layered architecture is used: api, business, persistence. Dependencies must go downward only.

- `api` - Contains API interaction including Tsoa controllers and request/response types.
- `cron` - Entry points for cron jobs. At the same "layer" as `api`.
- `business` - Contains business logic. `*Service` files are defined to provide facades to various subsystems to perform business functions. There are also utils.
- `entities` - Contains TypeORM entities corresponding to tables and views in the database.
- `repositories` - TypeORM automatically generates repositories for each entity, but extensions with custom queries can be defined here.
- `enum` - Enums can be shared between the frontend and backend. They are defined here.

### Cron jobs

Each cron job should be defined as a function in the `cron` directory, then registered in `/cron.ts` and in `serverless.yml` as a lambda function with a cron schedule.

## Features of note

### Photos and geocodes

The core of this app is photo metadata and geocoding records. Each `Photo` has many `GeocodeResult`s from geocoding services run when the app was built. The `effective_geocodes_view` is a materialized view represented by the `EffectiveGeocode` entity which contains the geocode we use for each photo. The query for that view uses a priority order of geocode services, and "corrections" submitted by users (`GeocodeCorrection`). The view is refreshed by a cron job to incorporate corrections.

### Stories

Stories was the first user-generated content feature and is pretty self-contained. It is not connected to Users or authentication as it was built before those features. Stories have their own authentication via jwt-based magic links sent via email which users can use to edit a specific story. Emails give users confirmation that their story was received and later published.

Stories are moderated by admins. All stories are submitted to the moderation queue at http://1940s.nyc/admin/review-stories.

Automatic moderation was considered but most of the rejected stories are not spam that could be detected by spam filters or CAPTCHAs but trolls or users who misuse the feature.

### Users and authentication

For a seamless user experience and to reduce costs, a custom authentication system was built instead of using a third party service like Auth0.

For any route tagged with `@Security('user-token')`, a user is created if one does not exist. The user is then considered logged in immediately without any information and is considered anonymous. Later, the user can provide, and optionally verify an email address. Specific features can check for verified email addresses if that level of security is needed. Corrections to geocodes, for example, require a verified email address. Colorization, however, can be done by anonymous users, allowing a limited "free trial" experience.

**Log-in process**: The user supplies an email address: if an account exists the user is sent a magic link to log in, or the email is associated with the current possibly anonymous account they are logged in with. Magic links are JWT tokens.

Notably, **Stories** are not connected to Users because Stories were built first with their own authentication mechanism. Users primarily support the Colorization feature for payment and credit ledgering and the Corrections feature for safety.

### Credit ledgering

Users can purchase "Color tokens" to colorize images. This is managed via the Ledger system, which is just a ledger of credits issued and images colorized. Users can go negative as we allow one free colorization per day as a trial.

`LedgerService.withMeteredUsage` is a wrapper to wrap code that requires and consumes credits.

### Admin users

Admin users actually _do_ use a third-party authentication service: Netlify Identity. This was built before end-user authentication and could potentially be updated to use the same system.

Admin users have roles defined in Identity.

A route tag for an admin route looks like `@Security('netlify', ['moderator'])`. This requires an Identity user to be logged in and have the role `moderator`.

### Email campaigns

1940s.nyc has an occasional newsletter. To avoid the costs of a third-party service like Mailchimp, a simple system was built into the app.

It's pretty simple. When a campaign is enqueued via the API it just creates a sending record for every list member. A cron job sends out the unsent emails in batches.
The email content lives in Postmark templates.

There's currently no sign-up form for the mailing list. Addresses are just added whenever they provide an email via other app features like Stories.

### Map sync

Every night, a cron job refreshes the materialized views, regenerates a set of geojson, and generates PMTiles.

This important process supports geocode corrections and user story labels.

## Third party services

- Maplibre - For the map using self-hosted PMTiles
- AWS SSM - For secrets
- Postmark - For transactional and campaign emails
- Netlify Identity - For admin users
- Stripe - For payments
- OpenAI - For story title generation
- Palette - For colorization
