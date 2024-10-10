import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;

    const {deployer} = await getNamedAccounts();

    const complianceDeployment = await deployments.get('ModularCompliance');
    const complianceAddress = complianceDeployment.address;

    const identityRegistryDeployment = await deployments.get('IdentityRegistry');
    const identityRegistryAddress = identityRegistryDeployment.address;

    await deploy('Token', {
        from: deployer,
        log: true,
        proxy: {
            proxyContract: "OpenZeppelinTransparentProxy",
            execute: {
                init: {
                    methodName: 'init',
                    args: [
                        identityRegistryAddress,
                        complianceAddress,
                        "Token Testing",
                        "TT",
                        18,
                        "0xCD80D3Af6add9accA9a159ABA7eb76123a3b0d3F"
                    ]
                }
            }
        }
    });

};
export default func;
func.tags = ['Token'];
func.dependencies = ['TokenStorage', "AgentRoleUpgradeable", "IdentityRegistry", "ModularCompliance"];
