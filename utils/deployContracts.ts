import {BigNumber, Contract, Signer} from "ethers";
import {ethers} from "hardhat";
import OnchainID from "@onchain-id/solidity";

async function deployIdentityProxy(implementationAuthority: Contract['address'], managementKey: string, signer: Signer) {
    const identity = await new ethers.ContractFactory(OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, signer).deploy(
        implementationAuthority,
        managementKey,
    );

    return ethers.getContractAt('Identity', identity.address, signer);
}

export const INDIA_COUNTRY_CODE = 356;
export const USA_COUNTRY_CODE = 840;
export const ARUBA_COUNTRY_CODE = 533;

export async function deployFullSuiteContracts() {
    const [deployer, tokenIssuer, tokenAgent, tokenAdmin, claimIssuer, aliceWallet, bobWallet, charlieWallet, davidWallet, anotherWallet] =
        await ethers.getSigners();

    const d = await ethers.getSigners()
    console.log(d.length)

    const claimIssuerSigningKey = ethers.Wallet.createRandom();
    const aliceActionKey = ethers.Wallet.createRandom();

    // Deploy implementations
    const claimTopicsRegistryImplementation = await ethers.deployContract('ClaimTopicsRegistry', deployer);
    const trustedIssuersRegistryImplementation = await ethers.deployContract('TrustedIssuersRegistry', deployer);
    const identityRegistryStorageImplementation = await ethers.deployContract('IdentityRegistryStorage', deployer);
    const identityRegistryImplementation = await ethers.deployContract('IdentityRegistry', deployer);
    const modularComplianceImplementation = await ethers.deployContract('ModularCompliance', deployer);
    const tokenImplementation = await ethers.deployContract('Token', deployer);
    const identityImplementation = await new ethers.ContractFactory(
        OnchainID.contracts.Identity.abi,
        OnchainID.contracts.Identity.bytecode,
        deployer,
    ).deploy(deployer.address, true);

    const identityImplementationAuthority = await new ethers.ContractFactory(
        OnchainID.contracts.ImplementationAuthority.abi,
        OnchainID.contracts.ImplementationAuthority.bytecode,
        deployer,
    ).deploy(identityImplementation.address);

    const identityFactory = await new ethers.ContractFactory(OnchainID.contracts.Factory.abi, OnchainID.contracts.Factory.bytecode, deployer).deploy(
        identityImplementationAuthority.address,
    );

    const trexImplementationAuthority = await ethers.deployContract(
        'TREXImplementationAuthority',
        [true, ethers.constants.AddressZero, ethers.constants.AddressZero],
        deployer,
    );
    const versionStruct = {
        major: 4,
        minor: 0,
        patch: 0,
    };
    const contractsStruct = {
        tokenImplementation: tokenImplementation.address,
        ctrImplementation: claimTopicsRegistryImplementation.address,
        irImplementation: identityRegistryImplementation.address,
        irsImplementation: identityRegistryStorageImplementation.address,
        tirImplementation: trustedIssuersRegistryImplementation.address,
        mcImplementation: modularComplianceImplementation.address,
    };
    await trexImplementationAuthority.connect(deployer).addAndUseTREXVersion(versionStruct, contractsStruct);

    const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.address, identityFactory.address], deployer);
    await identityFactory.connect(deployer).addTokenFactory(trexFactory.address);

    const claimTopicsRegistry = await ethers
        .deployContract('ClaimTopicsRegistryProxy', [trexImplementationAuthority.address], deployer)
        .then(async (proxy) => ethers.getContractAt('ClaimTopicsRegistry', proxy.address));

    const trustedIssuersRegistry = await ethers
        .deployContract('TrustedIssuersRegistryProxy', [trexImplementationAuthority.address], deployer)
        .then(async (proxy) => ethers.getContractAt('TrustedIssuersRegistry', proxy.address));

    const identityRegistryStorage = await ethers
        .deployContract('IdentityRegistryStorageProxy', [trexImplementationAuthority.address], deployer)
        .then(async (proxy) => ethers.getContractAt('IdentityRegistryStorage', proxy.address));

    // DEploy a modular compliance contract
    const modularCompliance = await ethers.deployContract('ModularCompliance', deployer);
    await modularCompliance.init()
    const countryAllowModule = await ethers.deployContract('CountryAllowModule', deployer);
    await countryAllowModule.initialize();

    const identityRegistry = await ethers
        .deployContract(
            'IdentityRegistryProxy',
            [trexImplementationAuthority.address, trustedIssuersRegistry.address, claimTopicsRegistry.address, identityRegistryStorage.address],
            deployer,
        )
        .then(async (proxy) => ethers.getContractAt('IdentityRegistry', proxy.address));

    const tokenOID = await deployIdentityProxy(identityImplementationAuthority.address, tokenIssuer.address, deployer);
    const tokenName = 'TREXDINO';
    const tokenSymbol = 'TREX';
    const tokenDecimals = BigNumber.from('0');
    const token = await ethers
        .deployContract(
            'TokenProxy',
            [
                trexImplementationAuthority.address,
                identityRegistry.address,
                modularCompliance.address,
                tokenName,
                tokenSymbol,
                tokenDecimals,
                tokenOID.address,
            ],
            deployer,
        )
        .then(async (proxy) => ethers.getContractAt('Token', proxy.address));

    await modularCompliance.addModule(countryAllowModule.address);

    await modularCompliance
        .connect(deployer)
        .callModuleFunction(
            new ethers.utils.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [
                [INDIA_COUNTRY_CODE, USA_COUNTRY_CODE],
            ]),
            countryAllowModule.address,
        );

    // await countryAllowModule.connect(deployer).addAllowedCountry(INDIA_COUNTRY_CODE);

    await identityRegistryStorage.connect(deployer).bindIdentityRegistry(identityRegistry.address);

    // await token.connect(tokenAgent).mint(bobWallet.address, 500);
    //
    // await agentManager.connect(tokenAgent).addAgentAdmin(tokenAdmin.address);
    // await token.connect(deployer).addAgent(agentManager.address);
    // await identityRegistry.connect(deployer).addAgent(agentManager.address);
    //
    // await token.connect(tokenAgent).unpause();

    return {
        accounts: {
            deployer,
            tokenIssuer,
            acmeCorpEmployee: tokenAgent,
            tokenAdmin,
            govtOfIndia_claimIssuer: claimIssuer,
            claimIssuerSigningKey,
            pavanActionKey: aliceActionKey,
            pavanWallet: aliceWallet,
            mahboobWallet: bobWallet,
            shyamWallet: charlieWallet,
            davidWallet,
            anotherWallet,
        },
        suite: {
            claimTopicsRegistry,
            trustedIssuersRegistry,
            identityRegistryStorage,
            modularCompliance,
            identityRegistry,
            tokenOID,
            token,
        },
        authorities: {
            trexImplementationAuthority,
            identityImplementationAuthority,
        },
        factories: {
            trexFactory,
            identityFactory,
        },
        implementations: {
            identityImplementation,
            claimTopicsRegistryImplementation,
            trustedIssuersRegistryImplementation,
            identityRegistryStorageImplementation,
            identityRegistryImplementation,
            modularComplianceImplementation,
            tokenImplementation,
        },
    };
}
