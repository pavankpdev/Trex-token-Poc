import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deployer } = await getNamedAccounts(); // Fetch deployer from namedAccounts

    const deployerSigner = await ethers.getSigner(deployer);

    const tokenDeployment = await deployments.get('Token');
    const tokenAddress = tokenDeployment.address;

    const tokenContract = await ethers.getContractAt('Token', tokenAddress, deployerSigner);

    const newOnchainID = "0xCD80D3Af6add9accA9a159ABA7eb76123a3b0d3F";

    console.log(`Setting the new onchain ID to: ${newOnchainID}`);

    const tx = await tokenContract.setOnchainID(newOnchainID);

    await tx.wait();
    console.log(`New onchain ID has been set successfully. Transaction Hash: ${tx.hash}`);
};

export default func;
func.tags = ['setOnchainID'];
