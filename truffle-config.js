const config = require("@aragon/truffle-config-v4")

config.networks["cfx-testnet"] = {
    host: "test.confluxrpc.com",
    port: 80,
    network_id: "*",
    type: "conflux",
    privateKeys: process.env.PRIVATE_KEY,
    gas: 8000000
}

config.networks["cfx-development"] = {
    host: "localhost",
    port: 12537,
    network_id: "*",
    type: "conflux"
}

module.exports = {
    ...config,
    compilers: {
        solc: {
            version: "0.4.24", // Fetch exact version from solc-bin (default: truffle's version)
            optimizer: {
                enabled: false,
                runs: 200
            }
        }
    }
}
