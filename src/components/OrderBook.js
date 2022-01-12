import React, { Component } from "react";
import { connect } from "react-redux";
import {
  orderBookSelector,
  orderBookLoadedSelector,
  accountSelector,
  exchangeSelector,
  orderFillingSelector,
} from "../store/selectors.js";

import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { fillOrder } from "../store/interactions";

import Spinner from "./Spinner";

const renderOrder = (order, props) => {
  const { dispatch, exchange, account } = props;
  return (
    <OverlayTrigger
      overlay={
        <Tooltip id={order.id}>
          {`click here to ${order.orderFillAction}`}
        </Tooltip>
      }
    >
      <tr
        key={order.id}
        className="order-book-order"
        onClick={(e) => {
          fillOrder(dispatch, exchange, order, account);
        }}
      >
        <td>{order.tokenAmount}</td>
        <td className={`text-${order.orderTypeClass}`}>{order.tokenPrice}</td>
        <td>{order.etherAmount}</td>
      </tr>
    </OverlayTrigger>
  );
};
const showOrderBook = (props) => {
  const { openOrders } = props;

  return (
    <tbody>
      {/*sell orders */}
      {openOrders.sellOrders.map((order) => renderOrder(order, props))}

      <tr>
        <th> DAPP</th>
        <th> DAPP/ETH</th>
        <th> ETH</th>
      </tr>

      {/*buy orders */}

      {openOrders.buyOrders.map((order) => renderOrder(order, props))}
    </tbody>
  );
};

export class OrderBook extends Component {
  render() {
    return (
      <div className="vertical">
        <div className="card bg-dark text-white">
          <div className="card-header">Order Book</div>
          <div className="card-body order-book">
            <table className="table table-dark table-sm small">
              {this.props.isOrderBookLoaded ? (
                showOrderBook(this.props)
              ) : (
                <Spinner type="table" />
              )}
            </table>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const orderBookLoaded = orderBookLoadedSelector(state);
  const orderFilling = orderFillingSelector(state);

  return {
    openOrders: orderBookSelector(state),
    isOrderBookLoaded: orderBookLoaded && !orderFilling,
    account: accountSelector(state),
    exchange: exchangeSelector(state),
  };
};

export default connect(mapStateToProps)(OrderBook);
