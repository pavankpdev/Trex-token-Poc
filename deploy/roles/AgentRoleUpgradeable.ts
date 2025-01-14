import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;

    const {issuer} = await getNamedAccounts();

    await deploy('AgentRoleUpgradeable', {
        from: issuer,
        log: true,
    });
};
export default func;
func.tags = ['AgentRoleUpgradeable'];
func.dependencies = ['Roles'];
