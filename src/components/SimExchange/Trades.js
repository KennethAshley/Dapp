import React, { Component } from 'react';
import { Layout, Row, Col } from 'antd';

import TradeContainer from './TradeContainer';
import { MarketJS } from '../../util/marketjs/marketMiddleware';

import '../../less/Trades.less';

const { Content } = Layout;

class Trades extends Component {
  constructor(props) {
    super(props);

    this.getOrders = this.getOrders.bind(this);
    this.getUnallocatedCollateral = this.getUnallocatedCollateral.bind(this);

    this.state = {
      unallocatedCollateral: 0
    };
  }

  componentDidMount() {
    const { simExchange } = this.props;

    if (
      simExchange.contract !== null &&
      simExchange.contract.MARKET_COLLATERAL_POOL_ADDRESS
    ) {
      this.getUnallocatedCollateral(this.props);
      // this.getOrders(simExchange.contract.key);
    }
  }

  componentDidUpdate(prevProps) {
    const oldContract = prevProps.simExchange.contract;
    const newContract = this.props.simExchange.contract;

    if (newContract !== oldContract && newContract !== null) {
      this.getUnallocatedCollateral(this.props);
      // this.getOrders(newContract.key);
    }
  }

  getOrders(contractAddress) {
    fetch(`https://dev.api.marketprotocol.io/orders/${contractAddress}/`)
      .then(function(response) {
        return response.json();
      })
      .then(
        function(response) {
          this.setState({
            buys: response.buys,
            sells: response.sells,
            contract: response.contract
          });
        }.bind(this)
      );
  }

  getUnallocatedCollateral(props) {
    const { simExchange } = props;

    if (simExchange) {
      MarketJS.getUserAccountBalanceAsync(simExchange.contract, true).then(
        balance => {
          this.setState({
            unallocatedCollateral: balance
          });
        }
      );
    }
  }

  render() {
    const { unallocatedCollateral, buys, sells, contract } = this.state;
    const { simExchange } = this.props;

    return (
      <Layout id="trading">
        <Content>
          <Row type="flex" justify="flex-start">
            <span className="trading-balance">
              Available for Trading: {unallocatedCollateral}{' '}
              {simExchange.contract &&
                simExchange.contract.COLLATERAL_TOKEN_SYMBOL}
            </span>
          </Row>
          <Row type="flex" justify="space-around" gutter={24}>
            <Col span={12}>
              <TradeContainer
                {...this.props}
                type="bids"
                market=""
                data={buys}
                contract={contract}
              />
            </Col>
            <Col span={12}>
              <TradeContainer
                {...this.props}
                type="asks"
                market=""
                data={sells}
                contract={contract}
              />
            </Col>
          </Row>
        </Content>
      </Layout>
    );
  }
}

export default Trades;
