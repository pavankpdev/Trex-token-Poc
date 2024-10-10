import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {txLogger} from "../../../utils/ts-logger";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deployer } = await getNamedAccounts(); // Fetch issuer from namedAccounts

    const issuerSigner = await ethers.getSigner(deployer);

    const complianceDeployment = await deployments.get('ModularCompliance');
    const complianceAddress = complianceDeployment.address;

    const moduleDeployment = await deployments.get('CountryAllowModule');
    const moduleAddress = moduleDeployment.address;

    const complianceContract = await ethers.getContractAt('ModularCompliance', complianceAddress, issuerSigner);

    const tx = await complianceContract.addModule(moduleAddress)

    await tx.wait();
    console.log(`New module has been set successfully`);
    txLogger(tx)
};

export default func;
func.tags = ['mountComplianceModule'];
func.dependencies = ['ModularCompliance', 'CountryAllowModule'];
