import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {txLogger} from "../../utils/ts-logger";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { issuer } = await getNamedAccounts(); // Fetch issuer from namedAccounts

    const deployerSigner = await ethers.getSigner(issuer);

    const tokenDeployment = await deployments.get('Token');
    const tokenAddress = tokenDeployment.address;

    const tokenContract = await ethers.getContractAt('Token', tokenAddress, deployerSigner);

    const tx = await tokenContract.mint(issuer, 1000);

    await tx.wait();
    console.log(`Minted Tokens successfully`);
    txLogger(tx)
};

export default func;
func.tags = ['mintToSelf'];
