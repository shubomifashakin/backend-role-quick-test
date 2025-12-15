# NOVACRUST STAGE 2 TAKE HOME

This is the take-home assignment for Novacrust Stage 2.

## Scalability

- **Endpoint Separation**: Split transaction history and wallet details into separate endpoints for better maintainability
- **Pagination**: At the moment, we get the a wallets entire transaction history in a single request. This is not ideal. We can implement cursor-based pagination for transaction history to efficiently handle large datasets. In reality, wallets may have thousands or millions of transactions, fetching them in a single request means we request all of this at once which would definitely increase response times and server load.

- **Scheduled Transfers**: We can also implement a scheduled transaction feature. With this, users can dictate the time a transaction should occur and the transaction would happen at that period (or a few seconds/minutes after that but never before). Implementation details are as follows:
  - User sends the transaction request (amount, currency, time to occur etc)
  - We create an event in eventbridge to be executed at stated time of the user. Event Bridge's configurable feature allows for a grace period after the scheduled time, ensuring transactions can still be executed even if systems experience delays.
  - When the time comes, the event sends the payload to a FIFO based SQS queue.
  - The sqs queue then forwards the payload to a consumer (lambda or webhook etc) which would be responsible for executing/processing the scheduled transaction.

- **Load balancing**: Another no brainer is habing multiple instances of our server running at all times. We can put them behind a load balancer (nginx or any other appropriate load balancer)

- **Caching**: We can introduce a redis backed cache layer for read heavy routes, (like the transaction history one). Transaction details barely change after the transaction is complete. To reduce response times, we can cache the details in a kv store like redis and reduce requests to our actual database.

- **Rate limiting**: Ideally, all routes are meant to be rate limited by default. Implementing a redis backed rate limit store is also needed to scale the application and prevent abuse.

- **Logging**: Structured logging for all requests. At the moment, errors are not logged.

## Notes

Env is committed only because its needed for easy setups.

## API Documentation

- **Postman Collection**: [View in Postman](https://documenter.getpostman.com/view/29426986/2sB3dTtnwB)
- **OpenAPI Spec**: [wallets-openapi.yaml](./wallets-openapi.yaml)

## Setup Instructions

- Clone the repository
- Install dependencies
  ```
  npm install
  ```
- Start the postgres docker container

  ```
  docker compose up -d
  ```

- Start the server

  ```
  npm run start
  ```

- Run tests

  ```
  npm run test
  ```

  ```
  npm run test:e2e
  ```
