import './FillOrder.less';

import React, { Component } from 'react';
import { Layout, Input, Form, Button } from 'antd';
import { MarketJS } from '../../util/marketjs/marketMiddleware';

const { Content } = Layout;
const { TextArea } = Input;
const FormItem = Form.Item;

class FillOrder extends Component {
  constructor(props) {
    super(props);

    this.onSubmit = this.onSubmit.bind(this);
    this.updateOrderJSON = this.updateOrderJSON.bind(this);

    this.state = {
      orderJSON: ''
    };
  }

  onSubmit(e) {
    e.preventDefault();

    MarketJS.tradeOrderAsync(this.state.orderJSON, this.state.orderJSON);
  }

  updateOrderJSON(e) {
    this.setState({
      orderJSON: e.target.value
    });
  }

  render() {
    return (
      <Layout>
        <Content>
          <Form onSubmit={this.onSubmit}>
            <FormItem>
              <TextArea
                placeholder="{contractAddress: &quot;0x8a9dac478c64b2c4f62e12045a9f55b4dde473b0&quot;, expirationTimestamp: BigNumber, feeRecipient: &quot;0x0000000000000000000000000000000000000000&quot;, maker: &quot;0xce5fdef0592271c41c4ac07ddb52ae3bbb3fcb9e&quot;, makerFee: BigNumber, …}"
                rows={4}
                onChange={this.updateOrderJSON}
              />
            </FormItem>

            <FormItem>
              <Button
                disabled={this.state.orderJSON === ''}
                type="primary"
                htmlType="submit"
              >
                Submit
              </Button>
            </FormItem>
          </Form>
        </Content>
      </Layout>
    );
  }
}

export default FillOrder;
