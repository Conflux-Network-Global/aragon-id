require("dotenv").config()
const namehash = require("eth-ens-namehash").hash
const keccak256 = require("js-sha3").keccak_256
const logDeploy = require("@conflux-/aragon-os/scripts/helpers/deploy-logger")
const getAccounts = require("@conflux-/aragon-os/scripts/helpers/get-accounts")

const globalArtifacts = this.artifacts // Not injected unless called directly via truffle
const globalWeb3 = this.web3 // Not injected unless called directly via truffle

const defaultOwner = process.env.OWNER
const defaultENSAddress = process.env.ENS

const tld = namehash("cfx")
const label = "0x" + keccak256("aragonid")
const node = namehash("aragonid.cfx")

module.exports = async (
    truffleExecCallback,
    {
        artifacts = globalArtifacts,
        web3 = globalWeb3,
        ensAddress = defaultENSAddress,
        owner = defaultOwner,
        verbose = true
    } = {}
) => {
    try {
        const log = (...args) => {
            if (verbose) { console.log(...args) }
        }

        const accounts = await getAccounts(web3)

        log(`Deploying AragonID with ENS: ${ensAddress} and owner: ${owner}`)
        const FIFSResolvingRegistrar = artifacts.require("FIFSResolvingRegistrar")
        const ENS = artifacts.require("AbstractENS")

        const publicResolver = await (await ENS.at(ensAddress)).resolver(namehash("resolver.cfx"))
        const aragonID = await FIFSResolvingRegistrar.new(ensAddress, publicResolver, node, {from: owner})
        await logDeploy(aragonID, { verbose })

        log("assigning ENS name to AragonID")
        const ens = await ENS.at(ensAddress)

        const nodeOwner = await ens.owner(node)
        console.log("🚀 ~ file: deploy.js ~ line 46 ~ nodeOwner", nodeOwner)
        const firstAccount = accounts[0]
        console.log("🚀 ~ file: deploy.js ~ line 48 ~ firstAccount", firstAccount)
        if (await ens.owner(node) === accounts[0]) {
            log("Transferring name ownership from deployer to AragonID")
            await ens.setOwner(node, aragonID.address, { from: owner })
        } else {
            log("Creating subdomain and assigning it to AragonID")
            try {
                await ens.setSubnodeOwner(tld, label, aragonID.address, { from: owner })
            } catch (err) {
                console.error(
                    "Error: could not set the owner of 'aragonid.cfx' on the given ENS instance",
                    `(${ensAddress}). Make sure you have ownership rights over the subdomain.`
                )
                throw err
            }
        }

        if (owner) {
            log("assigning owner name")
            await aragonID.register("0x" + keccak256("owner"), owner, {from: owner})
        }

        log("===========")
        log("Deployed AragonID:", aragonID.address)
        truffleExecCallback()
    } catch (err) {
        console.log("err", err)
        throw new Error(err)
    }
}
