import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {txLogger} from "../../utils/ts-logger";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers, getUnnamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();
    const [alice] = await getUnnamedAccounts();

    const deployerSigner = await ethers.getSigner(deployer);

    const tokenDeployment = await deployments.get('Token');
    const tokenAddress = tokenDeployment.address;

    const tokenContract = await ethers.getContractAt('Token', tokenAddress, deployerSigner);

    const tx = await tokenContract.transfer(alice, 1);

    await tx.wait();
    console.log(`Transferred Token successfully to Alice.`);
    txLogger(tx)
};

export default func;
func.tags = ['transferToken'];
