# express-rest-boilerplate

![CI](https://github.com/danielfsousa/express-rest-boilerplate/actions/workflows/ci.yaml/badge.svg?branch=main)
[![codecov](https://codecov.io/gh/danielfsousa/express-rest-boilerplate/branch/main/graph/badge.svg?token=oSbnKr4vBP)](https://codecov.io/gh/danielfsousa/express-rest-boilerplate)
[![swagger](https://img.shields.io/badge/docs-swagger-green)](https://express-rest-boilerplate.onrender.com/docs)

A Boilerplate/Generator/Starter template for building RESTful APIs and microservices using modern Javascript, Node.js, Express and MongoDB.

This is a highly opinionated and fully featured starter template, if you don't need some feature or dependency, just delete it.

Swagger: https://express-rest-boilerplate.onrender.com/docs

## Table of Contents

- [express-rest-boilerplate](#express-rest-boilerplate)
  - [Table of Contents](#table-of-contents)
  - [Requirements](#requirements)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [With a Package Manager](#with-a-package-manager)
    - [With Github](#with-github)
    - [With Docker Compose](#with-docker-compose)
  - [Folder Structure](#folder-structure)
  - [Scripts](#scripts)
  - [Environment Variables](#environment-variables)

## Requirements

- [Node 18+](https://nodejs.org/en/download/) or [Docker](https://www.docker.com/)

## Features

- No transpilers, just vanilla javascript
- Node 18 and ES2022 latest features like [top-level await](https://h3manth.com/ES2022/#top-level-await)
- [ECMAScript modules](https://nodejs.org/api/esm.html#modules-ecmascript-modules) and import aliases
- Code completion and optional type checking with [Typescript](https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html), [JSDoc](https://code.visualstudio.com/docs/languages/javascript#_jsdoc-support) and [VSCode's IntelliSense](https://code.visualstudio.com/docs/nodejs/working-with-javascript#_intellisense)
- Structured logs with [pino](https://github.com/pinojs/pino)
- Metrics with [Prometheus](https://github.com/siimon/prom-client) client
- [OpenTelemetry](https://opentelemetry.io/) auto instrumentation for traces, metrics and logs.
- Linting and formatting with [eslint](https://github.com/eslint/eslint) and [prettier](https://github.com/prettier/prettier)
- API documentation with [OpenAPI v3](https://swagger.io/specification/) and [Swagger UI](https://swagger.io/tools/swagger-ui/)
- Request validation based on OpenAPI definition with [openapi-validator-middleware](https://github.com/PayU/openapi-validator-middleware)
- Health checks and gracefull shutdown with [Terminus](https://github.com/godaddy/terminus)
- MongoDB ORM with [Mongoose](https://mongoosejs.com/)
- [Docker](https://www.docker.com/) with [multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build/) and [distroless](https://github.com/GoogleContainerTools/distroless) base image for production builds
- [Docker compose](https://docs.docker.com/compose/) file for easy setup, including observability tools (Grafana, Loki, Tempo and Prometheus)
- Load environment variables from .env files with [dotenv](https://github.com/rolodato/dotenv-safe)
- Unit and integration tests with [Vitest](https://vitest.dev/) and [Supertest](https://github.com/visionmedia/supertest)
- Code coverage with [Codecov](https://about.codecov.io/) github action
- Git pre-commit hooks with [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged)
- Authentication and Authorization with [passport](http://passportjs.org)
- Automatic error handling for express asynchronous routes with [express-async-errors](https://github.com/davidbanham/express-async-errors)
- CI/CD with [Github Actions](https://github.com/features/actions)
- Auto reload with [node's watch mode](https://nodejs.org/dist/latest-v18.x/docs/api/cli.html#--watch)
- Server and tests debugging with [VSCode's debugger](https://code.visualstudio.com/docs/editor/debugging)
- [Dependabot](https://docs.github.com/pt/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates) configuration file for automatic dependency updates
- CORS configuration

## Getting Started

### With a Package Manager

1. Install Node.JS v18. You can use a node version manager like [fnm](https://github.com/Schniz/fnm).

```bash
fnm install
fnm use
```

2. Download the template and install the dependencies.

```bash
# with npm
npm init @danielfsousa express-rest-boilerplate my-api

# with yarn
yarn create @danielfsousa express-rest-boilerplate my-api

# with pnpm
pnpm create @danielfsousa express-rest-boilerplate my-api
```

3. Change .env database credentials

```bash
cp .env.example .env
nano .env
```

4. Run server in development mode. The server will restart everytime a file is changed.

```bash
# with npm
npm run start:dev

# with yarn
yarn start:dev

# with pnpm
pnpm start:dev
```

### With Github

In github you can click on `Use this template` to create a new repository based on this template.

Then, you can clone the template, install the dependencies and follow steps 3 and 4.

```bash
git clone git@github.com:<username>/<repo>.git
cd <repo>
npm install
```

### With Docker Compose

You can use docker to spin up the server and the mongo database.

```bash
docker compose up
```

This template also includes examples of some popular observality (o11y) tools to store logs, metrics and traces. You can start Loki, Grafana, Tempo and Prometheus using docker.

Make sure to set the following environment variables:

```bash
LOG_FORMAT=json
OTEL_ENABLED=true
```

and run docker compose passing the `o11y` profile tag.

```bash
docker compose --profile o11y up
```

Now all your logs, metrics and traces can be visualized in Grafana.

A standard dashboard for the application is automatically created, now go to http://localhost:3000/dashboards to open Grafana and click on the `express-rest-boilerplate` dashboard under `General`.

To learn how to search for logs and traces in Grafana, take a look at the [documentation](https://grafana.com/docs/grafana/latest/explore).

## Folder Structure

```bash
├── config  # configuration files for docker compose containers
├── bin     # command-line entrypoints
├── src     # source code
│   ├── controllers  # app controllers
│   ├── enums        # enums
│   ├── errors       # project wide error classes
│   ├── lib          # configures and reexports libraries
│   ├── middlewares  # express middlewares
│   ├── models       # mongoose models
│   ├── routes       # api routes
│   ├── services     # bussines logic
│   ├── templates    # email templates
│   ├── validations  # TODO: remove folder
│   ├── main.js      # server entrypoint
│   └── config.js    # configuration object from environment variables
└── test             # tests
    ├── integration  # integration tests
    └── unit         # unit tests

```

## Scripts

```bash
npm run lint       # lints code and check formatting
npm run lint:fix   # lints code, check formatting and tries to fix found problems
npm run start      # starts server
npm run start:dev  # starts server in watch mode, waiting for file changes
npm run test       # runn all tests in watch mode, waiting for file changes
npm run test:cov   # runn all tests and report coverage
npm run validate   # runs lint and test scripts for files on git's staging area
```

## Environment Variables

| Name                          | Type                                             | Description                             |
| ----------------------------- | ------------------------------------------------ | --------------------------------------- |
| NODE_ENV                      | production \| development \| test                | NodeJS environment                      |
| PORT                          | Number                                           | Server port to listen for requests      |
| LOG_FORMAT                    | json \| pretty                                   | Format of logs                          |
| LOG_LEVEL                     | trace \| debug \| info \| warn \| error \| fatal | Logs below this level will be discarded |
| LOG_DATABASE_QUERIES          | Boolean                                          | Should log database queries?            |
| OTEL_ENABLED                  | Boolean                                          | Enable OpenTelemetry                    |
| OTEL_SERVICE_NAME             | String                                           | Name of the service                     |
| OTEL_EXPORTER_JAEGER_ENDPOINT | String                                           | Jaegar export endpoint for traces       |
| JWT_SECRET                    | String                                           | JWT key for authn                       |
| JWT_EXPIRATION_MINUTES        | Number                                           | JWT expiration duration in minutes      |
| MONGO_URI                     | String                                           | MongoDB URI                             |
| EMAIL_PORT                    | Number                                           | SMTP port                               |
| EMAIL_HOST                    | String                                           | SMTP server host for sending emails     |
| EMAIL_USERNAME                | String                                           | SMTP server username                    |
| EMAIL_PASSWORD                | String                                           | SMTP server password                    |
