import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import OnchainID from '@onchain-id/solidity';
import {ethers} from "hardhat";
import {BigNumber, Contract, Signer} from "ethers";
import {deployFullSuiteContracts, INDIA_COUNTRY_CODE, USA_COUNTRY_CODE} from "../../utils/deployContracts";

export async function deployIdentityProxy(implementationAuthority: Contract['address'], managementKey: string, signer: Signer) {
    const identity = await new ethers.ContractFactory(OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, signer).deploy(
        implementationAuthority,
        managementKey,
    );

    return ethers.getContractAt('Identity', identity.address, signer);
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

    const {
        suite: {token, claimTopicsRegistry, identityRegistry, trustedIssuersRegistry},
        accounts: {acmeCorpEmployee, deployer, govtOfIndia_claimIssuer, claimIssuerSigningKey, pavanActionKey, mahboobWallet, pavanWallet, shyamWallet},
        authorities: {identityImplementationAuthority, trexImplementationAuthority}
    } = await deployFullSuiteContracts();


    // Assign/deploy an agent to manage the assets
    // Note: This can be the owner as well
    const agentManager = await ethers.deployContract('AgentManager', [token.address], acmeCorpEmployee);
    await token.connect(deployer).addAgent(acmeCorpEmployee.address);

    const claimTopics = [ethers.utils.id('AGE_VERIFICATION')];
    await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[0]);
    const claimIssuerContract = await ethers.deployContract('ClaimIssuer', [govtOfIndia_claimIssuer.address], govtOfIndia_claimIssuer);

    // Adding an OnchainId entry for the `govtOfIndia_claimIssuer` as CLAIM signer. The CLAIM signer keys, used to sign claims on other identities which need to be revokable
    await claimIssuerContract
        .connect(govtOfIndia_claimIssuer)
        .addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [claimIssuerSigningKey.address])), 3, 1);

    // We're adding the onchain id for the trusted issuer, not their direct eth address
    await trustedIssuersRegistry.connect(deployer).addTrustedIssuer(claimIssuerContract.address, claimTopics);

    const pavanIdentity = await deployIdentityProxy(identityImplementationAuthority.address, pavanWallet.address, deployer);
    // Adding my identity to onchainID with the purpose of 2.
    // 2 -> ACTION keys, which perform actions in this identities name (signing, logins, transactions, etc.)
    await pavanIdentity
        .connect(pavanWallet)
        .addKey(ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [pavanActionKey.address])), 2, 1);

    const mahboobIdentity = await deployIdentityProxy(identityImplementationAuthority.address, mahboobWallet.address, deployer);
    const shyamIdentity = await deployIdentityProxy(identityImplementationAuthority.address, shyamWallet.address, deployer);

    await identityRegistry.connect(deployer).addAgent(acmeCorpEmployee.address)
    await identityRegistry.connect(deployer).addAgent(token.address);

    await identityRegistry
        .connect(acmeCorpEmployee)
        .batchRegisterIdentity([pavanWallet.address, mahboobWallet.address], [pavanIdentity.address, mahboobIdentity.address], [INDIA_COUNTRY_CODE, USA_COUNTRY_CODE]).catch(console.log);

    // Basically govt issuing our claims here stating that we're above 21 yos, check the `claimIssuerSigningKey` it's the GOI signing
    const claimForPavan = {
        data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('Pavan is above 21 years old.')),
        issuer: claimIssuerContract.address,
        topic: claimTopics[0],
        scheme: 1,
        identity: pavanIdentity.address,
        signature: '',
    };
    claimForPavan.signature = await claimIssuerSigningKey.signMessage(
        ethers.utils.arrayify(
            ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'bytes'], [claimForPavan.identity, claimForPavan.topic, claimForPavan.data]),
            ),
        ),
    );

    await pavanIdentity
        .connect(pavanWallet)
        .addClaim(claimForPavan.topic, claimForPavan.scheme, claimForPavan.issuer, claimForPavan.signature, claimForPavan.data, '');

    const claimForMahboob = {
        data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('Mahboob is above 21 years old.')),
        issuer: claimIssuerContract.address,
        topic: claimTopics[0],
        scheme: 1,
        identity: mahboobIdentity.address,
        signature: '',
    };
    claimForMahboob.signature = await claimIssuerSigningKey.signMessage(
        ethers.utils.arrayify(
            ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'bytes'], [claimForMahboob.identity, claimForMahboob.topic, claimForMahboob.data]),
            ),
        ),
    );

    await mahboobIdentity
        .connect(mahboobWallet)
        .addClaim(claimForMahboob.topic, claimForMahboob.scheme, claimForMahboob.issuer, claimForMahboob.signature, claimForMahboob.data, '');

    const balances = {
        beforePavan: "",
        beforeMahboob: "",
        afterPavan: "",
        afterMahboob: "",
    }
    await token.connect(acmeCorpEmployee).unpause();
    await token.connect(acmeCorpEmployee).mint(pavanWallet.address, 1000);

    balances.beforePavan = (await token.balanceOf(pavanWallet.address)).toString();
    balances.beforeMahboob = (await token.balanceOf(mahboobWallet.address)).toString();

    await token.connect(pavanWallet).transfer(mahboobWallet.address, 1).catch(console.log);

    balances.afterPavan = (await token.balanceOf(pavanWallet.address)).toString();
    balances.afterMahboob = (await token.balanceOf(mahboobWallet.address)).toString();

    console.log(balances);

    const claimId = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['address', 'uint256'], // _issuer (address) and _topic (uint256)
            [claimForMahboob.issuer, claimForMahboob.topic]
        )
    );

    const tx = await mahboobIdentity
        .connect(mahboobWallet)
        .removeClaim(claimId)

    await tx.wait();

    // This will error out
    await token.connect(pavanWallet).transfer(mahboobWallet.address, 1).catch(console.log);

    // Optional: Revoke the existing token
    await token.connect(acmeCorpEmployee).forcedTransfer(mahboobWallet.address, pavanWallet.address, 1).catch(console.log);

    balances.beforePavan = (await token.balanceOf(pavanWallet.address)).toString();
    balances.beforeMahboob = (await token.balanceOf(mahboobWallet.address)).toString();

    await token.connect(pavanWallet).transfer(mahboobWallet.address, 1).catch(console.log);

    balances.afterPavan = (await token.balanceOf(pavanWallet.address)).toString();
    balances.afterMahboob = (await token.balanceOf(mahboobWallet.address)).toString();

    console.log(balances);
};
export default func;
func.tags = ['simulation-2'];
