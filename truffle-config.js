require("babel-register");
require("babel-polyfill");
require("dotenv").config();
require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
const privateKeys = process.env.PRIVATE_KEYS || "";
const infura = process.env.INFURA_API;

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(privateKeys.split(","), infura);
      },
      gas: 5500000, // Ropsten has a lower block limit than mainnet
      gasPrice: 25000000000, // 25 gwei (in wei) (default: 100 gwei)
      network_id: 4,
    },
  },
  contracts_directory: "./src/contracts",
  contracts_build_directory: "./src/abis",
  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
