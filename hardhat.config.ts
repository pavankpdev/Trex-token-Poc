import '@xyrusworx/hardhat-solidity-json';
import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import '@openzeppelin/hardhat-upgrades';
import 'solidity-coverage';
import '@nomiclabs/hardhat-solhint';
import '@primitivefi/hardhat-dodoc';
import 'hardhat-deploy';

const pvtKeys = {
  deployer: "0x1538d25d04e53f4bc73e1aef6dff73d4e34952440385f1cb93d3515e50099e10",
  issuer: "0x2278d4c078b006c33f5ce8d15aca731c1fd4d412380466f199a84e1551356eeb",
  investor: "0xa38f15e4232fdbc695be43d2daaa842ab6ba0e540faee423a1e479c87e17cd6b"
}
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: true,
  },
  networks: {
    local: {
      url: 'HTTP://127.0.0.1:7545',
      accounts: [
          ...Object.values(pvtKeys),
          '0x74d334e8528f4e433c511b3bc85387b77ecfb47b9417348e3b526847d4d43ffc',
          "0x07929169e6913fed4492a358828e37bab03a2ecde7d1cc7b5cbd0f107787b168",
          "0xdc0a1ad881b13f4d41339344f9d6a0a43876226a9fba1e2fab4d5319995c9bcd",
          "0xcd3e6051037767c2f5f30b55a0970df4f9008671231e7aa4a2943b1a0cb60797",
          "0x1b53dcbca2b96490b41e7d96ee263e4c3202bc46fb5dfa53135a5c858066097f",
          "0x348c764bdb16cdb76803aec0b68526611a758e7c904d1ffea31e6b56fc8ac590",
          "0x3d0f9b6a1274c0ba1c3af13301358fc8a23c820eedd34586cd9d5b97fd2065ab"
      ],
    },

  },
  dodoc: {
    runOnCompile: false,
    debugMode: true,
    outputDir: "./docgen",
    freshOutput: true,
  },
  paths: {
    deploy: 'deploy',
    deployments: 'deployments',
    imports: 'imports'
  },
  namedAccounts: {
    deployer: 0,
    issuer: 1,
    investor: 2,
  },
};

export default config;
