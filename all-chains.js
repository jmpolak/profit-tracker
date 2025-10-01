// @ToDo put it in db or redis
const AAVE_CHAINS = [
  {
    name: 'AaveV3Ethereum',
    chainName: 'Ethereum',
    chainId: 1,
    poolAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  },
  // {
  //   name: 'AaveV3EthereumEtherFi',
  //   chainName: 'Ethereum',
  //   chainId: 1,
  //   poolAddress: '0x0AA97c284e98396202b6A04024F5E2c65026F3c0',
  // },
  // {
  //   name: 'AaveV3EthereumLido',
  //   chainName: 'Ethereum',
  //   chainId: 1,
  //   poolAddress: '0x4e033931ad43597d96D6bcc25c280717730B58B1',
  // },
  // {
  //   name: 'AaveV3EthereumHorizon',
  //   chainName: 'Ethereum',
  //   chainId: 1,
  //   poolAddress: '0xAe05Cd22df81871bc7cC2a04BeCfb516bFe332C8',
  // },
  {
    name: 'AaveV3Polygon',
    chainName: 'Polygon',
    chainId: 137,
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  },
  {
    name: 'AaveV3Arbitrum',
    chainName: 'Arbitrum',
    chainId: 42161,
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  },
  {
    name: 'AaveV3Optimism',
    chainName: 'Optimism',
    chainId: 10,
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  },
  {
    name: 'AaveV3Avalanche',
    chainName: 'Avalanche',
    chainId: 43114,
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  },
  {
    name: 'AaveV3Base',
    chainName: 'Base',
    chainId: 8453,
    poolAddress: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
  },
];

module.exports = { AAVE_CHAINS };
