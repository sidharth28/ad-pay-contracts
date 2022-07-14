# Setup:

Install modules and dependencies:

```shell
npm install

```

# Deploy contracts locally:

Run node :

```shell
npx hardhat node

```

Another terminal:

```shell
npx hardhat run --network localhost scripts/deploy.ts
```

# Deploy contracts on Rinkeby :

(Add funds to this wallet(0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1) to test on Rinkeby )

```shell
npx hardhat run --network rinkeby scripts/deploy.ts
```

# Testing:

Run test cases:

```shell
 npx hardhat test

```
