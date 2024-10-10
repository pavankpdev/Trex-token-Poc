import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {txLogger} from "../../utils/ts-logger";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deployer, issuer: agent } = await getNamedAccounts(); // Fetch deployer from namedAccounts

    const deployerSigner = await ethers.getSigner(deployer);

    const tokenDeployment = await deployments.get('Token');
    const tokenAddress = tokenDeployment.address;

    const tokenContract = await ethers.getContractAt('Token', tokenAddress, deployerSigner);

    const tx = await tokenContract.addAgent(agent);

    await tx.wait();
    console.log(`Agent added successfully`);
    txLogger(tx)
};

export default func;
func.tags = ['addAgent'];
