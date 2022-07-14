import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/b398f4cfc53b4f5390600438d995f1ba`,
      accounts: {
        mnemonic:
          "myth like bonus scare over problem client lizard pioneer submit female collect",
      },
    },
  },
};

export default config;
