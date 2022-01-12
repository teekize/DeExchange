import React, { Component } from "react";
import { connect } from "react-redux";
import {
  filledOrderSelector,
  filledOrdersLoadedSelector,
} from "../store/selectors";
import Spinner from "./Spinner";

export class Trades extends Component {
  displaytrades(filledOrders) {
    return (
      <tbody>
        {this.props.filledOrders.map((order) => {
          return (
            <tr className={`order-${order.id}`} key={order.id}>
              <td className="text-muted">{order.formattedTimestamp}</td>
              <td>{order.tokenAmount}</td>
              <td className={`text-${order.tokenPriceClass}`}>
                {order.tokenPrice}
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  }

  render() {
    return (
      <div className="vertical  bod-radius">
        <div className="card bg-same text-white">
          <div className="card-header">Trades</div>
          <div className="card-body">
            <table className="table bg-same table-sm small text-white">
              <thead>
                <tr>
                  <th scope="col">TIME</th>
                  <th scope="col">DAPP</th>
                  <th scope="col">DAPP/ETH</th>
                </tr>
              </thead>
              {this.props.filledOrdersLoaded ? (
                this.displaytrades(this.props.filledOrders)
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

const mapStateToProps = (state) => ({
  filledOrders: filledOrderSelector(state),
  filledOrdersLoaded: filledOrdersLoadedSelector(state),
});

export default connect(mapStateToProps)(Trades);
