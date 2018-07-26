import BigNumber from 'bignumber.js';
import abi from 'human-standard-token-abi';
import moment from 'moment';
import BigNumber from 'bignumber.js';

import store from '../../store';

import { toBaseUnit } from '../utils';
import showMessage from '../../components/message';

// PUBLIC

/**
 * This file is a middleware wrapper for the MARKET.js library. It abstracts away
 * the cruft of building up the needed objects to complete these transactions.
 **/

/**
 * @param orderData user inputed order data object {qty, price, expirationTimestamp}
 * @returns {object} signed order hash
 **/
const createSignedOrderAsync = orderData => {
  const { marketjs, simExchange } = store.getState();
  const web3 = store.getState().web3.web3Instance;

  let order = {
    contractAddress: simExchange.contract.key,
    expirationTimestamp: new BigNumber(
      moment(orderData.expirationTimestamp).unix()
    ),
    feeRecipient: '0x0000000000000000000000000000000000000000',
    maker: web3.eth.coinbase,
    makerFee: new BigNumber(0),
    taker: '',
    takerFee: new BigNumber(0),
    orderQty: new BigNumber(orderData.qty),
    price: new BigNumber(orderData.price),
    salt: new BigNumber(1)
  };

  return marketjs.createSignedOrderAsync(...Object.values(order));
};

/**
 * @param contract a valid market contract (required)
 * @param toString boolean - if true will convert the response to a fixed number
 * string otherwise returns bigNumber(optional)
 * @returns BigNumber or String value of an addresses unallocated collateral
 **/
/**
 * @param amount the amount of collateral tokens you want to deposit
 * @returns boolean
 **/
const depositCollateralAsync = amount => {
  const { simExchange, marketjs } = store.getState();
  const web3 = store.getState().web3.web3Instance;

  const txParams = {
    from: web3.eth.coinbase
  };

  let collateralTokenContractInstance = web3.eth
    .contract(abi)
    .at(simExchange.contract.COLLATERAL_TOKEN_ADDRESS);

  collateralTokenContractInstance.decimals.call((err, decimals) => {
    collateralTokenContractInstance.approve(
      simExchange.contract.MARKET_COLLATERAL_POOL_ADDRESS,
      new BigNumber(toBaseUnit(amount.number, decimals)),
      txParams,
      (err, res) => {
        if (err) {
          console.error(err);
        } else {
          marketjs
            .depositCollateralAsync(
              simExchange.contract.key,
              new BigNumber(toBaseUnit(amount.number, decimals)),
              txParams
            )
            .then(res => {
              showMessage(
                'success',
                'Deposit successful, your transaction will process shortly.',
                5
              );

              return res;
            });
        }
      }
    );
  });
};

const getUserAccountBalanceAsync = (contract, toString) => {
  const marketjs = store.getState().marketjs;
  const web3 = store.getState().web3.web3Instance;

  return marketjs
    .getUserAccountBalanceAsync(contract.key, web3.eth.coinbase)
    .then(res => {
      switch (toString) {
        case true:
          const unallocatedCollateral = web3
            .fromWei(res.toFixed(), 'ether')
            .toString();

          return unallocatedCollateral;
        default:
          return res;
      }
    });
};

/**
 * @param amount the amount of collateral tokens you want to deposit
 * @returns boolean
 **/
const withdrawCollateralAsync = amount => {
  const { simExchange, marketjs } = store.getState();
  const web3 = store.getState().web3.web3Instance;

  const txParams = {
    from: web3.eth.coinbase
  };

  let collateralTokenContractInstance = web3.eth
    .contract(abi)
    .at(simExchange.contract.COLLATERAL_TOKEN_ADDRESS);

  collateralTokenContractInstance.decimals.call((err, decimals) => {
    marketjs
      .withdrawCollateralAsync(
        simExchange.contract.key,
        toBaseUnit(amount.number, decimals),
        txParams
      )
      .then(res => {
        showMessage(
          'success',
          'Withdraw successful, your transaction will process shortly.',
          5
        );

        return res;
      });
  });
};

const tradeOrderAsync = signedOrderJSON => {
  const { marketjs } = store.getState();
  const web3 = store.getState().web3.web3Instance;
  const signedOrder = JSON.parse(signedOrderJSON);

  const txParams = {
    from: web3.eth.coinbase
  };

  signedOrder.taker = web3.eth.coinbase;
  signedOrder.expirationTimestamp = new BigNumber(
    signedOrder.expirationTimestamp
  );
  signedOrder.makerFee = new BigNumber(signedOrder.makerFee);
  signedOrder.orderQty = new BigNumber(signedOrder.orderQty);
  signedOrder.price = new BigNumber(signedOrder.price);
  signedOrder.remainingQty = new BigNumber(signedOrder.remainingQty);
  signedOrder.takerFee = new BigNumber(signedOrder.takerFee);

  marketjs
    .tradeOrderAsync(signedOrder, signedOrder.orderQty, txParams)
    .then(res => {
      return res;
    });
};

export const MarketJS = {
  createSignedOrderAsync,
  depositCollateralAsync,
  getUserAccountBalanceAsync,
  tradeOrderAsync,
  withdrawCollateralAsync
};
