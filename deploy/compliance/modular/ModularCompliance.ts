import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;

    const {deployer} = await getNamedAccounts();

    await deploy('ModularCompliance', {
        from: deployer,
        log: true,
        proxy: {
            execute: {
                init: {
                    methodName: 'init',
                    args: []
                }
            },
            proxyContract: "OpenZeppelinTransparentProxy",
        },
    });
};
export default func;
func.tags = ['ModularCompliance'];
func.dependencies = ['MCStorage'];
