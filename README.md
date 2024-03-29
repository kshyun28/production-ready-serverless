# production-ready-serverless

An exercise for the [Production-Ready Serverless Workshop (Jan 2024)](https://productionreadyserverless.com/?affiliateId=cd3bb326-fb0d-4789-af27-6674bb54ab80) by [Yan Cui (theburningmonk)](https://theburningmonk.com/).

This serverless application uses JavaScript, Node.js, and [Serverless Framework](https://www.serverless.com/).

## Local setup

1. Install dependencies: `npm install`

## Deployment and testing

1. Deploy serverless application: `npx sls deploy`
2. Generate `.env` file: `npm run dotEnv`
3. Seed restaurants table: `node seed-restaurants.js`
4. Run integration tests: `npm run test`
5. Run end-to-end tests: `npm run test:e2e`

## Removing the application

To remove the serverless application, run `npx sls remove`

## Load tests

For load testing, the application uses [artillery](https://www.artillery.io/).

- Artillery configuration is in `load-test.yml`
- Run load tests with `npm run test:load`
