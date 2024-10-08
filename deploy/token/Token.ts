import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;

    const {deployer} = await getNamedAccounts();

    await deploy('Token', {
        from: deployer,
        log: true,
        proxy: {
            proxyContract: "OpenZeppelinTransparentProxy",
            execute: {
                init: {
                    methodName: 'init',
                    args: [
                        "0x769fB1a6e97234C9e153a5bb32AB39C87A99facB",
                        "0x037D3E0fbfdE7E50D1F19C05518cDFf7d6A8f694",
                        "Token Testing",
                        "TT",
                        18,
                        "0x0000000000000000000000000000000000000000"
                    ]
                }
            }
        }
    });
};
export default func;
func.tags = ['Token'];
func.dependencies = ['TokenStorage', "AgentRoleUpgradeable"];
