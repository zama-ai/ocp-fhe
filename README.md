# Open Cap Table Protocol (OCP)

This repository implements the **Open Cap Table Protocol (OCP)** for managing cap tables on-chain. It adheres to the **Open Cap Format (OCF)** standard for data modeling and validation. OCP supports managing cap tables across multiple **EVM-compatible chains**.

## Repo Organization

-   **`src/`** → Server files (routes, MongoDB, etc.)
-   **`chain/`** → Smart contracts (Diamond pattern with facets)

## Prerequisites

Ensure you have the following installed:

-   [Forge](https://book.getfoundry.sh/)
-   [Node.js](https://nodejs.org/)
-   [Yarn](https://yarnpkg.com/)

## Setup & Running Locally

1. Copy `.env.example` to `.env`. (The example file includes a local database setup for testing, which we recommend.)

### Setup

1. Install dependencies:

    ```sh
    yarn install
    ```

2. You should see the factory contracts successfully deployed.

3. Start services:

    - **Terminal 1:** Start Anvil (local blockchain)

        ```sh
        anvil
        ```

    - **Terminal 2:** Deploy contracts

        ```sh
        yarn deploy:local
        ```

    - **Terminal 3:** Run the backend server
        ```sh
        yarn dev
        ```

## Multi-Chain Support

This repository supports deploying cap tables to different **EVM chains**.

-   Check `/src/chain.js` and configure the required chain keys.
-   When making API requests:
    -   **Issuer creation** → Pass `chainId` in the request body.
    -   **Other transactions** (e.g., creating stakeholders, issuing stock) → Pass `issuerId` in the request body.
-   See `/src/routes` for implementation details.

## Usage

1. Create an **issuer** first.
2. Add **stakeholders**, stock classes, and other relevant data.
3. For quick testing, use the example script:
    ```sh
    node src/examples/testTransfer.mjs
    ```

## Resetting Local Testing

If you are frequently testing locally, reset the database before redeploying:

```sh
yarn deseed
```

## Deployment

Use the appropriate command to deploy contracts:

-   **Local:**
    ```sh
    yarn deploy:local
    ```
-   **Testnet:**
    ```sh
    yarn deploy:testnet
    ```
-   **Mainnet:**
    ```sh
    yarn deploy:mainnet
    ```

## License

This project is licensed under the MIT License. See the [`LICENSE`](LICENSE) file for details.
