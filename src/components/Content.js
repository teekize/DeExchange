import React, { Component } from "react";
import { connect } from "react-redux";
import { loadAllOrders, subscribeToEvents } from "../store/interactions";
import { exchangeSelector } from "../store/selectors";
import Trades from "./Trades";
import OrderBook from "./OrderBook";
import MyTransactions from "./MyTransactions";
import PriceChart from "./PriceChart";
import Balance from "./Balance";
import NewOrder from "./NewOrder";

class Content extends Component {
  componentWillMount() {
    this.getBlockchainData(this.props.dispatch);
  }

  async getBlockchainData(dispatch) {
    await loadAllOrders(this.props.exchange, dispatch);
    await subscribeToEvents(this.props.exchange, dispatch);
  }

  render() {
    return (
      <div className="content ">
        <div className="vertical-split bod-radius">
          <Balance />
          <NewOrder />
        </div>

        {/* hapa ndio order book inakam  */}
        <OrderBook />

        <div className="vertical-split bod-radius flx-2">
          <PriceChart />

          <MyTransactions />
        </div>

        {/* trades  */}
        <Trades />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    exchange: exchangeSelector(state),
  };
}
export default connect(mapStateToProps)(Content);
