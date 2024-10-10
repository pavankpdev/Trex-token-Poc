import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {deployFullSuiteFixture} from "../../test/fixtures/deploy-full-suite.fixture";
import {deployFullSuiteContracts} from "../../utils/deployContracts";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts, run} = hre;

    const {
        suite: { token },
        accounts: { anotherWallet, tokenAgent },
    } = await deployFullSuiteFixture();

    const tx = await token.connect(tokenAgent).mint(anotherWallet.address, 1000);
    console.log(tx.hash);

    // const {deploy} = deployments;
    //
    // const {issuer} = await getNamedAccounts();
    //
    // await run("deploy", { tags: "Token" }); // Deploy Token
    // // await run("deploy", { tags: "addAgent" });
    // // await run("deploy", { tags: "mountComplianceModule" }) // Mount country allow module to compliance
    // await run("deploy", { tags: "mintToSelf" }) // Mint 1000 tokens to issuer
    // await run("deploy", { tags: "transferToken" }) // Transfer 1 token to alice

};
export default func;
func.tags = ['issuer'];
