import React, { Component } from 'react';
import { Layout, Menu } from 'antd';
import { Route, Redirect, Switch, withRouter } from 'react-router';
import { Link } from 'react-router-dom';

import TopBar from './TopBar';
import Trades from './Trades';
import Wallet from './Wallet';
import FillOrder from './FillOrder';

import './SimExchange.less';

const { Content, Header, Sider } = Layout;

class SimExchange extends Component {
  componentDidMount() {
    if (!this.props.contracts) {
      this.props.getContracts();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.contracts && !this.props.contract) {
      this.props.selectContract(this.props.contracts[0]);
    }
  }

  render() {
    const { asks, bids, contract, contracts, location } = this.props;

    if (!this.props.shouldRender) {
      return (
        <div
          className="text-center"
          style={{ fontSize: '18px', padding: '4em' }}
        >
          <strong>Coming soon...</strong>
        </div>
      );
    }

    return (
      <Layout>
        <Sider width={200}>
          <Menu mode="inline" selectedKeys={[location.pathname]}>
            <Menu.Item key="/exchange/trades/">
              <Link to="/exchange/trades/">Trades</Link>
            </Menu.Item>
            <Menu.Item key="/exchange/wallet/">
              <Link to="/exchange/wallet/">Wallet</Link>
            </Menu.Item>
            <Menu.Item key="/exchange/fill-order/">
              <Link to="/exchange/fill-order/">Fill Order</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Content className="exchange-content">
          <Header className="exchange-header">
            {location.pathname !== '/exchange/fill-order/' ? (
              <TopBar
                contract={contract}
                contracts={contracts}
                onSelectContract={this.props.selectContract}
              />
            ) : (
              <div>
                <h3>Fill Order</h3>
                <h5>Paste your ORDER JSON blob below to begin</h5>
              </div>
            )}
          </Header>
          <Switch>
            <Route
              path="/:url*"
              exact
              strict
              render={props => <Redirect to={`${props.location.pathname}/`} />}
            />
            <Route
              path="/exchange/trades/"
              exact
              render={() => <Trades {...this.props} asks={asks} bids={bids} />}
            />
            <Route
              exact
              path="/exchange/wallet/"
              render={() => <Wallet {...this.props} />}
            />
            <Route
              exact
              path="/exchange/fill-order/"
              render={() => <FillOrder {...this.props} />}
            />
            <Redirect to="/exchange/trades/" />
          </Switch>
        </Content>
      </Layout>
    );
  }
}

export default withRouter(SimExchange);
