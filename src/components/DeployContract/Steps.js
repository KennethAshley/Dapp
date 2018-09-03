/**
 * Steps for use by GuidedDeployment.
 *
 */
import { Button, Form, Icon, Steps, Input, Tooltip } from 'antd';
import moment from 'moment';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import BigNumber from 'bignumber.js';

import { Utils } from '@marketprotocol/marketjs';
import _ from 'lodash';

import Field, { FieldSettings } from './DeployContractField';
import DeployContractSuccess from './DeployContractSuccess';
import GasPriceField from '../GasPriceField';
import SelectTokenField from './SelectTokenField';
import { getEtherscanUrl, copyTextToClipboard } from '../../util/utils';
import { PriceGraph } from './PriceGraph';

// extract antd subcomponents
const Step = Steps.Step;
const ButtonGroup = Button.Group;

function BiDirectionalNav(props) {
  return (
    <div
      className="step-button-nav-container"
      style={props.isSimplified ? { width: '480px' } : { width: '100%' }}
    >
      {props.step > 0 && (
        <Button onClick={props.onPrevClicked} className="step-back-button">
          <Icon type="left" />Back
        </Button>
      )}
      <Button htmlType="submit" className="step-action-button">
        {props.text}
        <Icon type="right" />
      </Button>
    </div>
  );
}

class BaseStepComponent extends Component {
  /**
   * Validates form and updates Deployment State
   *
   * @param {*} e
   */
  handleSubmit(e) {
    e.preventDefault();

    const {
      exchangeApi,
      expirationTimeStamp,
      form,
      quoteAsset,
      symbolName
    } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }

      if (fieldsValue.contractName) {
        fieldsValue.contractName = Utils.createStandardizedContractName(
          symbolName.replace(quoteAsset, ''),
          quoteAsset,
          exchangeApi,
          new BigNumber(expirationTimeStamp),
          fieldsValue.contractName
        );
      }

      const timestamp = fieldsValue['expirationTimeStamp']
        ? {
            expirationTimeStamp: Math.floor(
              fieldsValue['expirationTimeStamp'].valueOf() / 1000
            )
          }
        : {};
      this.props.updateDeploymentState({
        ...fieldsValue,
        ...timestamp
      });
      this.props.onNextClicked();
    });
  }
}

/**
 * First step in the guided contract.
 * It displays two fields. First to collect name of the contract and
 * second to collect the collateral token address.
 *
 */
class NameContractStep extends BaseStepComponent {
  render() {
    const contractNameSettings = FieldSettings.contractName;
    const collateralTokenSettings = FieldSettings.collateralTokenAddress;

    return (
      <Form
        onSubmit={this.handleSubmit.bind(this)}
        layout="vertical"
        hideRequiredMark={true}
      >
        <h1 className="text-center">Contract Name and Collateral Token</h1>
        <div className="deploy-contract-container guided-deploy">
          <p>
            MARKET allows users to create user defined derivative contracts by
            outlining the needed specifications. This guide will walk you
            through creating a contract and the important variables.
          </p>
          <br />
          <h2>Contract Name</h2>
          <p>
            The contract name should be as descriptive as possible capturing the
            underlying asset relationship as well as possibly the expiration.
            Something like "<b>{contractNameSettings.initialValue}</b>" may help
            others understand the underlying asset, the data source, and
            expiration date in a nice human readable and searchable way.
            <br />
            <br />
            In the future, MARKET will implement a standardized naming
            convention and guidelines to formalize this process
            <br />
            <br />
            <span className="example-hint-text">
              Example name: <b>ETH/BTC-Kraken_2018-03-01</b>
            </span>
          </p>
          <Field
            name="contractName"
            initialValue={this.props.contractName}
            form={this.props.form}
            hideLabel
          />
          <h2>
            Collateral Token{' '}
            <span style={{ fontSize: '14px' }}>(Base Token Address)</span>
          </h2>
          <p>
            Next, every contract should be backed by an ERC20 Token that will be
            used as collateral for the contract. Traders must deposit tokens to
            the smart contract prior to trading, and upon execution of a trade,
            the appropriate amount of collateral becomes locked until that
            position is exited. In this fashion, all open positions always
            remain 100% collateralized removing counter party risk from the
            traders. Please specify a ERC20 Token address for this contract.
            <br />
            <br />
            In the future, users will be able to easily select from well known
            ERC20 tokens to ensure more safety and avoid dealing with long
            addresses.
            <br />
            <br />
            <span className="example-hint-text">
              Example address: <b>{collateralTokenSettings.initialValue}</b>
            </span>
          </p>
          <Field
            name="collateralTokenAddress"
            initialValue={this.props.collateralTokenAddress}
            form={this.props.form}
            hideLabel
          />
        </div>
        <BiDirectionalNav text="Select Oracle" {...this.props} />
      </Form>
    );
  }
}

NameContractStep = Form.create()(NameContractStep);

/**
 * Step for Setting Price Cap and floor
 *
 */
class PricingStep extends BaseStepComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  /**
   * Method for calibrating the step counter for Price floor &
   * Price cap input fields
   *
   * @param (number)
   * @return {number}
   */
  getStepValue(number) {
    // Taking care if the number passed is integer
    if (parseInt(number, 10) === number) {
      // Returning the least value if the number is integer
      return 1;
    }

    // Converting the number to string in order to calculate the number of
    // decimal digits.
    return (
      1 /
      parseFloat('1'.padEnd(number.toString().split('.')[1].length + 1, '0'))
    );
  }

  componentDidMount() {
    if (this.props.isSimplified) {
      this.props.form.setFieldsValue({
        priceCapSimplified: this.props.priceCapSimplified,
        priceFloorSimplified: this.props.priceFloorSimplified
      });
    }
  }

  render() {
    return (
      <Form
        className={this.props.isSimplified ? 'step-container' : ''}
        onSubmit={this.handleSubmit.bind(this)}
        layout="vertical"
        hideRequiredMark={true}
      >
        <h1 className="text-center">Specify Pricing Rules</h1>
        <div
          className={
            !this.props.isSimplified
              ? 'deploy-contract-container guided-deploy'
              : ''
          }
        >
          {this.props.isSimplified && (
            <div id="pricing-step-header">
              <h3 className="text-center">
                Current Price of {this.props.symbolName}:{' '}
                <span className="text-primary">{this.props.price}</span>
              </h3>
              <Field
                name="price"
                initialValue={this.props.price}
                form={this.props.form}
                style={{ display: 'none' }}
              />
            </div>
          )}
          {!this.props.isSimplified && (
            <div>
              <p>
                The Price Floor and Cap define the range of a contract. If an
                oracle reports a price above a Cap or below a Floor the contract
                will enter settlement and no longer trade. Additionally, these
                parameters define a participants maximum loss when entering a
                trade and therefore the amount collateral that must be posted.
              </p>
              <h3 className="m-top-20 m-bottom-20">
                All prices must in an integer format (e.g 1245, not 12.45),
                floating point values (decimals), are not currently supported by
                Ethereum.
              </h3>
            </div>
          )}
          <br />
          {!this.props.isSimplified && (
            <div>
              <h2>Price Decimal Places</h2>
              <p>
                Ethereum currently does not support floating points numbers.
                Therefore all prices reported by oracles must be converted to a
                whole number (integer). This variable is how many decimal places
                one needs to move the decimal in order to go from the oracle
                query price to an integer. For example, if the oracle query
                results returned a value of 190.22, we need to move the decimal
                two (2) places to convert to a whole number of 19022, so we
                would enter 2 below.
              </p>
              <Field
                name="priceDecimalPlaces"
                initialValue={this.props.priceDecimalPlaces}
                form={this.props.form}
                hideLabel
              />
            </div>
          )}
          <div
            className={this.props.isSimplified ? 'step-inner-container' : ''}
          >
            <h2>Price Cap</h2>
            {!this.props.isSimplified ? (
              <div>
                <p>
                  This is the upper bound of price exposure this contract will
                  trade. If the oracle reports a price above this value the
                  contract will enter into settlement. Following our example, if
                  we decide the Cap for our contract should be 230.00, we would
                  enter 23000 as our Cap.
                </p>
                <Field
                  name="priceCap"
                  initialValue={this.props.priceCap}
                  form={this.props.form}
                  hideLabel
                />
              </div>
            ) : (
              <Field
                name="priceCapSimplified"
                initialValue={this.props.priceCapSimplified}
                form={this.props.form}
                hideLabel
                stepValue={this.getStepValue(this.props.price)}
              />
            )}
            <h2>Price Floor</h2>
            {!this.props.isSimplified ? (
              <div>
                <p>
                  This is the lower bound of price exposure this contract will
                  trade. If the oracle reports a price below this value the
                  contract will enter into settlement. This should also be
                  represented as a whole number. If we take the example above of
                  a price of 190.22 and decide the Floor for our contract should
                  be 150.00, we would enter 15000 here.
                </p>
                <Field
                  name="priceFloor"
                  initialValue={this.props.priceFloor}
                  form={this.props.form}
                  hideLabel
                />
              </div>
            ) : (
              <Field
                name="priceFloorSimplified"
                initialValue={this.props.priceFloorSimplified}
                form={this.props.form}
                hideLabel
                stepValue={this.getStepValue(this.props.price)}
              />
            )}
            {this.props.showPricingGraph && (
              <div className="m-top-30">
                <PriceGraph
                  priceCap={this.props.form.getFieldValue('priceCapSimplified')}
                  priceFloor={this.props.form.getFieldValue(
                    'priceFloorSimplified'
                  )}
                  price={this.props.price}
                />
              </div>
            )}
          </div>
          <br />
          {!this.props.isSimplified && (
            <div>
              <h2>Price Quantity Multiplier</h2>
              <p>
                The quantity multiplier allows the user to specify how many base
                units (for Ethereum, this would be wei) each integer price
                movement changes the value of the contract. If our integerized
                price was 19022 with a qty multiplier of 1, and the price moved
                to 19023, then the value will have change by 1 wei. If however
                the multiplier was set at 1,000,000,000 the price movement of 1
                unit would now correspond to a value of 1 gwei (not wei). Please
                see{' '}
                <a
                  href="https://etherconverter.online/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {' '}
                  here{' '}
                </a>{' '}
                for an ethereum unit converter.
              </p>
              <Field
                name="qtyMultiplier"
                initialValue={this.props.qtyMultiplier}
                form={this.props.form}
                hideLabel
              />
            </div>
          )}
        </div>
        <BiDirectionalNav text="Set Expiration Time" {...this.props} />
      </Form>
    );
  }
}

PricingStep = Form.create()(PricingStep);

/**
 * Step for setting the expiration time for the contract
 *
 */
class ExpirationStep extends BaseStepComponent {
  render() {
    const {
      expirationTimeStamp,
      form,
      gas,
      isSimplified,
      location
    } = this.props;

    return (
      <Form
        className={isSimplified ? 'step-container' : ''}
        onSubmit={this.handleSubmit.bind(this)}
        layout="vertical"
        hideRequiredMark={true}
      >
        <h1 className="text-center">
          Set Expiration {!isSimplified ? '& Gas' : ''}
        </h1>
        <div
          className={
            !isSimplified ? 'deploy-contract-container guided-deploy' : ''
          }
        >
          {!isSimplified && (
            <p>
              Upon reaching the expiration timestamp all open positions will
              settle against the final price query returned by the oracle.
            </p>
          )}
          <br />
          <div className={isSimplified ? 'step-inner-container' : ''}>
            <h2>
              Date & Time{' '}
              <span style={{ fontSize: '14px' }}>
                ({moment().format('[UTC/GMT]Z')})
              </span>
            </h2>
            <Field
              name="expirationTimeStamp"
              initialValue={
                expirationTimeStamp
                  ? moment(expirationTimeStamp * 1000)
                  : isSimplified
                    ? moment().add(30, 'days')
                    : null
              }
              form={form}
              hideLabel
            />
            {!isSimplified && (
              <GasPriceField form={form} gaslimit={gas} location={location} />
            )}
          </div>
        </div>
        <BiDirectionalNav
          text={isSimplified ? 'Set Contract Name' : 'Deploy Contract'}
          {...this.props}
        />
      </Form>
    );
  }
}

ExpirationStep = Form.create()(ExpirationStep);

/**
 * Step to select the Oracle Data source and the query frequency for the contract
 *
 */
class DataSourceStep extends BaseStepComponent {
  render() {
    const { initialValues } = this.props;
    return (
      <Form
        onSubmit={this.handleSubmit.bind(this)}
        layout="vertical"
        hideRequiredMark={true}
      >
        <h1 className="text-center">Set Oracle Data Source</h1>
        <div className="deploy-contract-container guided-deploy">
          <p>
            Currently, Oraclize.it offers several different options for their
            data source. If you need help creating a proper oracle query, or
            availabe data sources please refer to the{' '}
            <a href="/test" target="_blank" rel="noopener noreferrer">
              Test Query
            </a>{' '}
            page.
          </p>
          <br />
          <h2>Select Data Source</h2>
          <p>Available data sources from Oraclize.it</p>
          <Field
            name="oracleDataSource"
            initialValue={
              this.props.oracleDataSource || initialValues.oracleDataSource
            }
            form={this.props.form}
            hideLabel
          />

          <h2>Oracle Query</h2>
          <p>
            Properly structured Oraclize.it query, Please use the{' '}
            <a href="/test" target="_blank" rel="noopener noreferrer">
              Test Query
            </a>{' '}
            page for clarification.
          </p>
          <Field
            name="oracleQuery"
            initialValue={this.props.oracleQuery || initialValues.oracleQuery}
            form={this.props.form}
            hideLabel
          />
        </div>
        <BiDirectionalNav text="View Pricing Rules" {...this.props} />
      </Form>
    );
  }
}

DataSourceStep = Form.create()(DataSourceStep);

/**
 * Step to select appropriate Gas amount for the contract deployment
 *
 */
class GasStep extends BaseStepComponent {
  render() {
    const { form, gas, location } = this.props;
    return (
      <div>
        <Form
          className="step-container"
          onSubmit={this.handleSubmit.bind(this)}
          layout="vertical"
        >
          <h1>Gas Settings</h1>
          <div className="step-inner-container">
            <GasPriceField
              form={form}
              gaslimit={gas}
              location={location}
              isSimplified={true}
            />
          </div>
          <BiDirectionalNav text="Deploy Contract" {...this.props} />
        </Form>
      </div>
    );
  }
}

GasStep = Form.create()(GasStep);

/*
  *  [WIP] Modifying UX flow for contract deployment to be more
  *        stepwise, descriptive, and educational.
  *
  *        See https://github.com/MARKETProtocol/dApp/issues/187.
 */
class DeployStep extends BaseStepComponent {
  constructor(props) {
    super(props);

    this.gotoStep = this.gotoStep.bind(this);

    this.steps = [
      {
        key: 'Deploy Contract',
        stepNum: 1,
        completed: false,
        error: false,
        description: {
          title: 'Deploying your MarketContract',
          explanation: `The MarketContract is the main contract responsible for facilitating many to many trading. Your customized contract is about to be deployed to the Ethereum blockchain and will soon be tradeable!
            We want other's to be able to find your awesome new contract, and are adding it to our registry so it will show up in the Contract Explorer page.`
        }
      },
      {
        key: 'Deploy Collateral Pool & Link Contract',
        stepNum: 2,
        completed: false,
        error: false,
        description: {
          title:
            'Deploying a new Collateral Pool for your contract & linking the same to your contract',
          explanation: `Each MARKET Protocol Smart Contract needs its own collateral pool to ensure that all trades are always 100% collateralized and solvent!.
             Finally, we must link your newly deployed contracts together to ensure all functionality is in place. Shortly, your contract will be all set for use. Happy Trading!`
        }
      },
      {
        key: 'Deployment Results',
        stepNum: 3,
        completed: false
      }
    ];

    this.initialState = {
      currStepNum: 1,
      activeStepKey: 'Deploy Contract',
      error: false,
      txHashes: {
        'Deploy Contract': null,
        'Deploy Collateral Pool & Link Contract': null
      }
    };

    this.state = Object.assign({}, this.initialState);
  }

  /*
   *  Possible values for 'props.currentStep', in order
   *  ------------------------------------------------------------------------
   *  [null]
   *    Uninitialized.
   *  [rejected]
   *    Something went wrong, deployment is cancelled, and an error message
   *    is exposed in 'props.error'.
   *  [pending]
   *    Waiting for contract deployment to start.
   *  [contractDeploying]
   *    Waiting for market contract deployment to complete.
   *  [collateralPoolDeploying]
   *    Waiting for market collateral pool deployment to complete.
   *  [deploymentComplete]
   *    Market collateral pool deployment has completed.
   *  [fulfilled]
   *    Full deployment process has completed and contract information is now
   *    exposed in 'props.contract'.
  **/
  componentWillReceiveProps(nextProps) {
    const currentStep = _.find(this.steps, { stepNum: this.state.currStepNum });

    if (this.props.currentStep !== nextProps.currentStep) {
      this.onUpdateCurrStep(nextProps.currentStep);
    }

    if (nextProps.error) {
      currentStep.error = nextProps.error;
    }

    this.onUpdateTxHashes(nextProps);

    if (this.props.loading && !nextProps.loading) {
      if (nextProps.error) {
        // We had an error
        this.props.showErrorMessage(
          `There was an error deploying the contract: ${nextProps.error}`,
          8
        );
        this.setState({ error: nextProps.error });
      } else if (nextProps.contract) {
        // Contract was deployed
        this.props.showSuccessMessage(
          DeployContractSuccess({ contract: nextProps.contract }),
          5
        );
      }
    }
  }

  componentDidMount() {
    if (this.props.deployContract) {
      this.props.deployContract();
    }
  }

  componentWillUnmount() {
    this.props.onResetDeploymentState();
  }

  onRetry() {
    this.setState(Object.assign(this.initialState));
    this.props.onResetDeploymentState({
      preservations: {
        currentStep: 'pending'
      }
    });
    if (this.props.deployContract) {
      this.props.deployContract();
    }
  }

  onUpdateCurrStep(currentStep) {
    // determine new step number
    let currStepNum;
    switch (currentStep) {
      case null:
      case 'pending':
      case 'contractDeploying':
        currStepNum = 1;
        break;
      case 'deploymentComplete':
      case 'collateralPoolDeploying':
        currStepNum = 2;
        break;
      case 'rejected':
      case 'fulfilled':
        currStepNum = this.state.currStepNum;
        break;
      default:
        currStepNum = 1;
    }
    // update state with the current step number
    this.setState({
      currStepNum
    });
  }

  onUpdateTxHashes(nextProps) {
    let { txHashes } = this.state;

    txHashes['Deploy Contract'] = nextProps.contractDeploymentTxHash;
    txHashes['Deploy Collateral Pool & Link Contract'] =
      nextProps.collateralPoolDeploymentTxHash;

    this.setState({ txHashes });
  }

  getStepIcon(key) {
    if (key === 'Deployment Results') {
      return this.props.contract ? 'check-circle-o' : 'close-circle-o';
    }

    if (this.state.error) {
      return 'close-circle-o';
    }

    return 'loading';
  }

  gotoStep(stepNum) {
    this.setState({ currStepNum: stepNum });
  }

  renderStep(step) {
    const {
      key,
      stepNum,
      error,
      description: { title = '', explanation = '' } = {}
    } = step;

    let { currStepNum, txHashes } = this.state;
    let txHash = txHashes[key];

    return (
      <Step
        key={key}
        title={key}
        status={error ? 'error' : ''}
        onClick={() => this.gotoStep(stepNum)}
        icon={
          stepNum === currStepNum && !txHash ? (
            <Icon
              type={this.getStepIcon(key)}
              style={{
                color: error ? '#FF0A0A' : '#00e2c1',
                fontSize: '33px'
              }}
            />
          ) : (
            ''
          )
        }
        description={
          <div>
            {!error ? (
              <div>
                {currStepNum === stepNum &&
                  (key === 'Deployment Results' ? (
                    <div>
                      {this.props.contract ? (
                        <div id={'contract-info-wrap'}>
                          <h4>{'Your contract has successfully deployed!'}</h4>
                          <p>Contract Address</p>
                          <div className="contract-result-input-container m-bottom-30">
                            <Input
                              className="contract-result-input"
                              disabled
                              value={this.props.contract.address}
                            />
                            <ButtonGroup>
                              <Tooltip
                                placement="top"
                                title={'Copy Contract Address'}
                              >
                                <Button
                                  type="primary"
                                  icon="copy"
                                  onClick={() =>
                                    copyTextToClipboard(
                                      this.props.contract.address
                                    )
                                  }
                                />
                              </Tooltip>
                              <Tooltip
                                placement="top"
                                title={'View Contract in Etherscan'}
                              >
                                <Button
                                  type="primary"
                                  icon="link"
                                  href={`${getEtherscanUrl(
                                    this.props.network
                                  )}/address/${this.props.contract.address}`}
                                  target={'_blank'}
                                />
                              </Tooltip>
                            </ButtonGroup>
                          </div>
                          <Link to={'/contract/explorer'}>
                            {'Explore All Contracts'}
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <h4>
                            {'There was an error deploying your contract.'}
                          </h4>

                          <p className={'deploy-step-description'}>{error}</p>

                          <div style={{ display: 'flex' }}>
                            <Button
                              id={'retry-button'}
                              type={'primary'}
                              onClick={this.onRetry.bind(this)}
                              style={{ padding: '0 50px' }}
                            >
                              {'Retry'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className={'deploy-step-description'}>
                        Transaction Hash:
                      </p>
                      {txHash ? (
                        <div className="contract-result-input-container m-bottom-30">
                          <Input
                            className="contract-result-input"
                            disabled
                            value={txHash}
                          />
                          <ButtonGroup>
                            <Tooltip
                              placement="top"
                              title={'Copy Contract Address'}
                            >
                              <Button
                                type="primary"
                                icon="copy"
                                onClick={() => copyTextToClipboard(txHash)}
                              />
                            </Tooltip>
                            <Tooltip
                              placement="top"
                              title={'View Contract in Etherscan'}
                            >
                              <Button
                                type="primary"
                                icon="link"
                                href={`${getEtherscanUrl(
                                  this.props.network
                                )}/address/${txHash}`}
                                target={'_blank'}
                              />
                            </Tooltip>
                          </ButtonGroup>
                        </div>
                      ) : (
                        'TBD'
                      )}
                      <h4>{title}</h4>
                      <p>{explanation}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <div>{currStepNum === stepNum && <div>{error}</div>}</div>
            )}
          </div>
        }
      />
    );
  }

  render() {
    return (
      <div className="step-container" id="deploy-step">
        <h1>Deploying Contracts</h1>
        <div className="step-inner-container" style={{ padding: '50px' }}>
          <Steps direction="vertical" current={this.state.currStepNum - 1}>
            {this.steps.map(step => this.renderStep(step))}
          </Steps>
        </div>
      </div>
    );
  }
}

/**
 * First step in the simplified contract.
 * [Dropdown] Select the API which user would like to use
 * [Dropdown] Select the symbol which is returned from the Binance exchangeInfo API
 *
 */
class ExchangeStep extends BaseStepComponent {
  constructor(props) {
    super(props);
    this.state = { exchangeApi: 'BIN' };
  }

  onChangeExchange(exchangeApi) {
    this.props.resetState();
    this.setState({ exchangeApi });
    this.props.form.resetFields([
      'tokenPairOptions',
      'tokenPair',
      'contractName',
      'priceFloorSimplified',
      'priceCapSimplified',
      'price'
    ]);
  }

  onChangeTokenPair() {
    this.props.form.resetFields(['tokenPair', 'contractName']);
    this.props.resetState();
    this.props.form.resetFields([
      'tokenPairOptions',
      'tokenPair',
      'contractName',
      'priceFloorSimplified',
      'priceCapSimplified',
      'price'
    ]);
  }

  render() {
    return (
      <Form
        className="step-container"
        onSubmit={this.handleSubmit.bind(this)}
        layout="vertical"
        hideRequiredMark={true}
      >
        <h1 className="text-center">Select exchange API & symbol</h1>
        <div className="step-inner-container">
          <h2>Exchange API</h2>
          <Field
            onChange={this.onChangeExchange.bind(this)}
            name="exchangeApi"
            initialValue={this.state.exchangeApi}
            form={this.props.form}
          />
          <h2>Symbol</h2>
          <Field
            name="tokenPairOptions"
            form={this.props.form}
            pairs={['ETH', 'USDT']}
            initialValue={'ETH'}
            onChange={this.onChangeTokenPair.bind(this)}
          />
          <SelectTokenField
            name="tokenPair"
            form={this.props.form}
            exchange={this.state.exchangeApi}
            onSelect={this.props.updateDeploymentState}
            hideLabel
          />
        </div>
        <BiDirectionalNav text="View Pricing Rules" {...this.props} />
        {/*<a href={'/contract/deploy?mode=quick'}>*/}
        {/*<p className="m-top-40 m-bottom-40">View advanced deploy</p>*/}
        {/*</a>*/}
      </Form>
    );
  }
}

ExchangeStep = Form.create()(ExchangeStep);

/**
 * Fifth step in the simplified contract.
 * [Input] Contract Name
 *
 */
class ContractNameStep extends BaseStepComponent {
  constructor(props) {
    super(props);

    let { contractName } = this.props;
    contractName = contractName
      ? Utils.parseStandardizedContractName(contractName).userText
      : '';

    this.state = {
      contractName,
      prefix: this.getStandardContractName('')
    };
  }

  getStandardContractName = name => {
    console.log(this.props);
    const {
      exchangeApi,
      expirationTimeStamp,
      quoteAsset,
      symbolName
    } = this.props;
    return Utils.createStandardizedContractName(
      symbolName.replace(quoteAsset, ''),
      quoteAsset,
      exchangeApi,
      new BigNumber(expirationTimeStamp),
      name
    );
  };

  handleChange = e => {
    const standardContractName = this.getStandardContractName(e.target.value);
    this.setState({
      contractName: Utils.parseStandardizedContractName(standardContractName)
        .userText
    });
  };

  render() {
    const { form } = this.props;
    let { contractName } = this.props;
    contractName = contractName
      ? Utils.parseStandardizedContractName(contractName).userText
      : '';

    return (
      <Form
        className="step-container"
        onSubmit={this.handleSubmit.bind(this)}
        layout="vertical"
        hideRequiredMark={true}
      >
        <h1 className="text-center">Contract Name</h1>
        <div className="step-inner-container">
          <h2>Enter Custom Text</h2>
          <Field
            name="contractName"
            form={form}
            initialValue={contractName}
            onChange={this.handleChange}
            hideLabel
          />
          <h2>Final Contract Name</h2>
          <p style={{ fontSize: '12px', fontWeight: 'bold' }}>
            <span style={{ opacity: '0.7' }}>{this.state.prefix}</span>
            {this.state.contractName}
          </p>
        </div>
        <BiDirectionalNav text={'Set Gas Price'} {...this.props} />
      </Form>
    );
  }
}

ContractNameStep = Form.create()(ContractNameStep);

export {
  ContractNameStep,
  NameContractStep,
  PricingStep,
  ExpirationStep,
  DataSourceStep,
  GasStep,
  DeployStep,
  ExchangeStep
};
