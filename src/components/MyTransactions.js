import React, { Component } from "react";
import { connect } from "react-redux";
import { Tabs, Tab } from "react-bootstrap";
import {
  myOpenOrdersSelector,
  myOpenOrdersLoadedSelector,
  myFilledOrdersSelector,
  myFilledOrdersLoadedSelector,
  accountSelector,
  exchangeSelector,
  orderCancellingSelector,
} from "../store/selectors";

import { cancelOrder } from "../store/interactions";
import Spinner from "./Spinner";

const showMyFilledOrders = (props) => {
  const { myFilledOrders } = props;

  return (
    <tbody>
      {myFilledOrders.map((order) => {
        return (
          <tr key={order.id}>
            <td className="text-muted">{order.formattedTimestamp}</td>
            <td className={`text-${order.orderTypeClass}`}>
              {order.orderSign}
              {order.tokenAmount}
            </td>
            <td className={`text-${order.orderTypeClass}`}>
              {order.tokenPrice}
            </td>
          </tr>
        );
      })}
    </tbody>
  );
};

const showMyOpenOrders = (props) => {
  const { myOpenOrders, dispatch, exchange, account } = props;

  return (
    <tbody>
      {myOpenOrders.map((order) => {
        return (
          <tr key={order.id}>
            <td className={`text-${order.orderTypeClass}`}>
              {order.tokenAmount}
            </td>
            <td className={`text-${order.orderTypeClass}`}>
              {order.tokenPrice}
            </td>
            <td
              className="text-muted cancel-order"
              onClick={(e) => {
                cancelOrder(dispatch, exchange, order, account);
              }}
            >
              X
            </td>

            {/* <td className="text-muted cancel-order"
              onClick={(e) => {
                cancelOrder(dispatch, exchange, order, account)
              }}
              >X
              </td> */}
          </tr>
        );
      })}
    </tbody>
  );
};

export class MyTransactions extends Component {
  render() {
    return (
      <div className="card bg-same text-white">
        <div className="card-header">My Transactions</div>
        <div className="card-body">
          <Tabs
            defaultActiveKey="trades"
            className="bg-dark text-white bod-radius"
          >
            <Tab
              eventKey="trades"
              title="Trades"
              className="bg-dark bod-radius"
            >
              <table className="table table-dark table-sm small bod-radius">
                <thead>
                  <tr>
                    <th> TIME</th>
                    <th> DAPP</th>
                    <th> DAPP/ETH</th>
                  </tr>
                </thead>
                {this.props.isMyFilledOrdersLoaded ? (
                  showMyFilledOrders(this.props)
                ) : (
                  <Spinner type="table" />
                )}
              </table>
            </Tab>
            <Tab
              eventKey="orders"
              title="Orders"
              className="bg-dark bod-radius"
            >
              <table className="table table-dark table-sm small bod-radius">
                <thead>
                  <tr>
                    <th> AMOUNT</th>
                    <th> DAPP/ETH</th>
                    <th> CANCEL</th>
                  </tr>
                </thead>
                {this.props.isMyOpenOrdersLoaded ? (
                  showMyOpenOrders(this.props)
                ) : (
                  <Spinner type="table" />
                )}
              </table>
            </Tab>
          </Tabs>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const myOpenOrdersLoaded = myOpenOrdersLoadedSelector(state);
  const orderCancelling = orderCancellingSelector(state);

  return {
    myOpenOrders: myOpenOrdersSelector(state),
    isMyOpenOrdersLoaded: myOpenOrdersLoaded && !orderCancelling,
    myFilledOrders: myFilledOrdersSelector(state),
    isMyFilledOrdersLoaded: myFilledOrdersLoadedSelector(state),
    exchange: exchangeSelector(state),
    account: accountSelector(state),
  };
};

export default connect(mapStateToProps)(MyTransactions);
