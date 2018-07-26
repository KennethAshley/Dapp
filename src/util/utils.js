import { message } from 'antd';
import store from '../store';
import abi from 'human-standard-token-abi';

import { NULL_ADDRESS } from '../constants';

import moment from 'moment';

/**
 *
 * @param priceFloor
 * @param priceCap
 * @param qtyMultiplier
 * @param qty
 * @param price
 * @return {number}
 */
export const calculateCollateral = function(
  priceFloor,
  priceCap,
  qtyMultiplier,
  qty,
  price
) {
  const zero = 0;
  let maxLoss;
  if (qty > zero) {
    if (price <= priceFloor) {
      maxLoss = zero;
    } else {
      maxLoss = price - priceFloor;
    }
  } else {
    if (price >= priceCap) {
      maxLoss = zero;
    } else {
      maxLoss = priceCap - price;
    }
  }
  return maxLoss * Math.abs(qty) * qtyMultiplier;
};

/**
 * Convert MetaMask error message to dApp error message.
 * Fallback: return original message.
 *
 * @param errorMessage
 * @return getMetamaskError
 */
export const formatedTimeFrom = function(text) {
  var now = moment();
  var then = moment.unix(text);
  var ago = '';
  var ms = moment(then, 'DD/MM/YYYY HH:mm:ss').diff(
    moment(now, 'DD/MM/YYYY HH:mm:ss')
  );
  if (ms < 0) {
    ms = moment(now, 'DD/MM/YYYY HH:mm:ss').diff(
      moment(then, 'DD/MM/YYYY HH:mm:ss')
    );
    ago = ' ago';
  }

  var d = moment.duration(ms);

  return [
    d.days(),
    'd ',
    d.hours(),
    'h ',
    d.minutes(),
    'm ',
    d.days() < 1 ? d.seconds() : '',
    d.days() < 1 ? 's ' : '',
    ago
  ].join('');
};
export const getMetamaskError = function(errorMessage) {
  if (errorMessage.indexOf('User denied transaction') !== -1)
    return 'User denied transaction';
  else return errorMessage;
};

export const getLocationOrigin = () => window.location.origin;

/**
 * Detect if network belongs to testnet/mainnet
 *
 * @param network
 * @return boolean true/false
 */
export const isTestnetOrMainnet = network => {
  return network !== 'truffle' && network !== 'unknown';
};

/**
 * Get an ERC20 Token Balance
 *
 * @param tokenAddress
 * @param toString
 * @param callback function for returning response from the web3 callback
 * @return BigNumber or String balance of users metamask address
 */
export const getTokenBalance = (tokenAddress, toString, callback) => {
  let web3 = store.getState().web3.web3Instance;

  let contractInstance = web3.eth.contract(abi).at(tokenAddress);

  return contractInstance.balanceOf.call(web3.eth.coinbase, (err, res) => {
    if (err) {
      console.error(err);
    } else {
      switch (toString) {
        case true:
          const availableCollateral = web3
            .fromWei(res.toFixed(), 'ether')
            .toString();

          return callback(availableCollateral);
        default:
          return callback(res);
      }
    }
  });
};

/**
 * Convert String to ERC20 Token Base Unit
 *
 * @param value
 * @param decimals
 * @return BigNumber String
 */
export const toBaseUnit = (value, decimals) => {
  return value * 10 ** decimals;
};

/**
 * Convert BigNumber String to Number
 *
 * @param value
 * @param decimals
 * @return Number
 */
export const fromBaseUnit = (value, decimals) => {
  return value / 10 ** decimals;
};

/** get Etherscan Url for correct Ethereum Network
 *
 * @param networkId(string)
 * return baseUrl
 */
export const getEtherscanUrl = networkId => {
  switch (networkId) {
    case 'mainnet':
      return 'https://etherscan.io';
    case 'morden':
      return 'https://morden.etherscan.io';
    case 'ropsten':
      return 'https://ropsten.etherscan.io';
    case 'rinkeby':
      return 'https://rinkeby.etherscan.io';
    case 'kovan':
      return 'https://kovan.etherscan.io';
    default:
      return '';
  }
};

/**
 * Set `collateralTokenAddress` based on the `network`
 *
 * `0x01b8de20c76ed06c7e93068a45951c26f70be3db` -- Web3.eth
 * `0x0c58e89866dda96911a78dedf069a1848618c185` -- Stable USD
 *
 * @param network
 * @param quoteAsset
 * @return collateralTokenAddress
 */
export const getCollateralTokenAddress = (network, quoteAsset) => {
  if (network === 'rinkeby') {
    switch (quoteAsset) {
      case 'ETH':
        return '0x2021c394e8fce5e56c166601a0428e4611147802';
      case 'WETH':
        return '0xc778417e063141139fce010982780140aa0cd5ab';
      case 'USDT':
      case 'USD':
        return '0xee78ae82ab0bbbae6d99b36a999e7b6de2e8664b';
      default:
        return '';
    }
  }

  return '';
};

/**
 * gets contract address from .json truffle artifacts
 * @param {string} contract
 * @param {number} networkId of the web3 network
 * @return {string}
 */
export const getContractAddress = (contract, networkId) => {
  return contract.networks[networkId]
    ? contract.networks[networkId].address
    : NULL_ADDRESS;
};

/**
 * Copies supplied text to the clipboard
 * @param {string} text
 */
export const copyTextToClipboard = text => {
  let textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    message.success('Copied successfully to clipboard');
  } catch (err) {
    console.log('Unable to copy the contract address to clipboard');
  }
  document.body.removeChild(textArea);
};
