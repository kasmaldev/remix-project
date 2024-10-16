import { Plugin } from '@remixproject/engine'
import { ContractABI, ContractAST, ContractSources, DeployOptions } from '../types/contract'
import { UUPS, UUPSABI, UUPSBytecode, UUPSfunAbi, UUPSupgradeAbi } from './constants/uups'

const proxyProfile = {
  name: 'openzeppelin-proxy',
  displayName: 'openzeppelin-proxy',
  description: 'openzeppelin-proxy',
  methods: ['isConcerned', 'executeUUPSProxy', 'executeUUPSContractUpgrade', 'getProxyOptions', 'getUpgradeOptions']
};
export class OpenZeppelinProxy extends Plugin {
  blockchain: any
  kind: 'UUPS' | 'Transparent'
  constructor(blockchain) {
    super(proxyProfile)
    this.blockchain = blockchain
  }

  async isConcerned(ast: ContractAST = {} as ContractAST): Promise<boolean> {
    // check in the AST if it's an upgradable contract
    if (ast.nodes && ast.nodes.find(node => node.absolutePath && node.absolutePath.includes(UUPS))) {
      this.kind = 'UUPS'
      return true
    }
    //
    // else if transparent contract run check true/false
    //
    return false
  }

  async getProxyOptions (data: ContractSources, file: string): Promise<{ [name: string]: DeployOptions }> {
    const contracts = data.contracts[file]
    const ast = data.sources[file].ast
    const inputs = {}

    if (this.kind === 'UUPS') {
      Object.keys(contracts).map(name => {
        if (ast) {
          const UUPSSymbol = ast.exportedSymbols['UUPSUpgradeable'] ? ast.exportedSymbols['UUPSUpgradeable'][0] : null

          ast.absolutePath === file && ast.nodes.map((node) => {
            if (node.name === name && node.linearizedBaseContracts.includes(UUPSSymbol)) {
              const abi = contracts[name].abi
              const initializeInput = abi.find(node => node.name === 'initialize')
      
              inputs[name] = {
                options: [{ title: 'Deploy with Proxy', active: false }, { title: 'Upgrade with Proxy', active: false }],
                initializeOptions: {
                  inputs: initializeInput,
                  initializeInputs: initializeInput ? this.blockchain.getInputs(initializeInput) : null
                }
              }
            }
          })
        }
      })
    }
    return inputs
  }

  async executeUUPSProxy(implAddress: string, args: string | string [] = '', initializeABI, implementationContractObject): Promise<void> {
    // deploy the proxy, or use an existing one
    if (!initializeABI) throw new Error('Cannot deploy proxy: Missing initialize ABI')
    args = args === '' ? [] : args
    const _data = await this.blockchain.getEncodedFunctionHex(args || [], initializeABI)

    if (this.kind === 'UUPS') this.deployUUPSProxy(implAddress, _data, implementationContractObject)
  }

  async executeUUPSContractUpgrade (proxyAddress: string, newImplAddress: string, newImplementationContractObject): Promise<void> {
    if (!newImplAddress) throw new Error('Cannot upgrade: Missing implementation address')
    if (!proxyAddress) throw new Error('Cannot upgrade: Missing proxy address')

    if (this.kind === 'UUPS') this.upgradeUUPSProxy(proxyAddress, newImplAddress, newImplementationContractObject)
  }

  async deployUUPSProxy (implAddress: string, _data: string, implementationContractObject): Promise<void> {
    const args = [implAddress, _data]
    const constructorData = await this.blockchain.getEncodedParams(args, UUPSfunAbi)
    const proxyName = 'ERC1967Proxy'
    const data = {
      contractABI: UUPSABI,
      contractByteCode: UUPSBytecode,
      contractName: proxyName,
      funAbi: UUPSfunAbi,
      funArgs: args,
      linkReferences: {},
      dataHex: UUPSBytecode + constructorData.replace('0x', '')
    }

    // re-use implementation contract's ABI for UI display in udapp and change name to proxy name.
    implementationContractObject.name = proxyName
    this.blockchain.deployProxy(data, implementationContractObject)
  }

  async upgradeUUPSProxy (proxyAddress: string, newImplAddress: string, newImplementationContractObject): Promise<void> {
    const fnData = await this.blockchain.getEncodedFunctionHex([newImplAddress], UUPSupgradeAbi)
    const proxyName = 'ERC1967Proxy'
    const data = {
      contractABI: UUPSABI,
      contractName: proxyName,
      funAbi: UUPSupgradeAbi,
      funArgs: [newImplAddress],
      linkReferences: {},
      dataHex: fnData.replace('0x', '')
    }
    // re-use implementation contract's ABI for UI display in udapp and change name to proxy name.
    newImplementationContractObject.name = proxyName
    this.blockchain.upgradeProxy(proxyAddress, newImplAddress, data, newImplementationContractObject)
  }
}
