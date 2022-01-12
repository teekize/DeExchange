import React, { Component } from "react";
import { connect } from "react-redux";
import {
  loadBalances,
  depositEther,
  withdrawEther,
  depositToken,
  withdrawToken,
} from "../store/interactions";
import { Tabs, Tab } from "react-bootstrap";
import Spinner from "./Spinner";
import {
  web3Selector,
  exchangeSelector,
  tokenSelector,
  accountSelector,
  etherBalanceSelector,
  exchangeEtherBalanceSelector,
  tokenBalanceSelector,
  exchangeTokenBalanceSelector,
  balanceLoadingSelector,
  etherDepositAmountSelector,
  etherWithdrawAmountSelector,
  tokenDepositAmountSelector,
  tokenWithdrawAmountSelector,
} from "../store/selectors";

import {
  etherDepositAmountChanged,
  etherWithdrawAmountChanged,
  tokenDepositAmountChanged,
  tokenWithdrawAmountChanged,
} from "../store/actions";

const showForm = (props) => {
  const {
    dispatch,
    exchange,
    web3,
    account,
    etherBalance,
    tokenBalance,
    exchangeEtherBalance,
    exchangeTokenBalance,
    etherDepositAmount,
    token,
    tokenDepositAmount,
    etherWithdrawAmount,
    tokenWithdrawAmount,
  } = props;

  return (
    <Tabs defaultActiveKey="deposit" className="bg-dark text-white">
      <Tab eventKey="deposit" title="Deposit" className="bg-dark">
        <table className="table table-dark table-sm small">
          <thead>
            <tr>
              <th>Token</th>
              <th>Wallet</th>
              <th>Exchange</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ETH</td>
              <td>{etherBalance}</td>
              <td>{exchangeEtherBalance}</td>
            </tr>
          </tbody>
        </table>
        <form
          className="row"
          onSubmit={(event) => {
            event.preventDefault();

            depositEther(dispatch, exchange, web3, etherDepositAmount, account);
          }}
        >
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="ETH Amount"
              onChange={(e) => {
                e.preventDefault();
                dispatch(etherDepositAmountChanged(e.target.value));
                console.log("changing....");
              }}
              className="form-control form-control-sm bg-dark text-white"
              required
            />
          </div>
          <div className="col-12 col-sm-auto pl-sm-0">
            <button type="submit" className="btn btn-primary btn-block btn-sm">
              Deposit
            </button>
          </div>
        </form>

        <table className="table table-dark table-sm small">
          <tbody>
            <tr>
              <td>DAPP</td>
              <td>{tokenBalance}</td>
              <td>{exchangeTokenBalance}</td>
            </tr>
          </tbody>
        </table>
        <form
          className="row"
          onSubmit={(event) => {
            event.preventDefault();

            depositToken(
              dispatch,
              exchange,
              web3,
              token,
              tokenDepositAmount,
              account
            );
          }}
        >
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="TOKEN Amount"
              onChange={(e) => {
                e.preventDefault();
                dispatch(tokenDepositAmountChanged(e.target.value));
                console.log("changing....");
              }}
              className="form-control form-control-sm bg-dark text-white"
              required
            />
          </div>
          <div className="col-12 col-sm-auto pl-sm-0">
            <button type="submit" className="btn btn-primary btn-block btn-sm">
              Deposit
            </button>
          </div>
        </form>
      </Tab>

      {/* ---------------------------WITHDRAW TAB---------------------------------------- */}
      <Tab eventKey="withdraw" title="Withdraw" className="bg-dark">
        <table className="table table-dark table-sm small">
          <thead>
            <tr>
              <th>Token</th>
              <th>Wallet</th>
              <th>Exchange</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ETH</td>
              <td>{etherBalance}</td>
              <td>{exchangeEtherBalance}</td>
            </tr>
          </tbody>
        </table>
        <form
          className="row"
          onSubmit={(event) => {
            event.preventDefault();

            withdrawEther(
              dispatch,
              exchange,
              web3,
              etherWithdrawAmount,
              account
            );
          }}
        >
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="ETH Amount"
              onChange={(e) => {
                e.preventDefault();
                dispatch(etherWithdrawAmountChanged(e.target.value));
                console.log("changing....");
              }}
              className="form-control form-control-sm bg-dark text-white"
              required
            />
          </div>
          <div className="col-12 col-sm-auto pl-sm-0">
            <button type="submit" className="btn btn-primary btn-block btn-sm">
              Withdraw
            </button>
          </div>
        </form>

        <table className="table table-dark table-sm small">
          <tbody>
            <tr>
              <td>DAPP</td>
              <td>{tokenBalance}</td>
              <td>{exchangeTokenBalance}</td>
            </tr>
          </tbody>
        </table>
        <form
          className="row"
          onSubmit={(event) => {
            event.preventDefault();

            withdrawToken(
              dispatch,
              exchange,
              web3,
              token,
              tokenWithdrawAmount,
              account
            );
          }}
        >
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="TOKEN Amount"
              onChange={(e) => {
                e.preventDefault();
                dispatch(tokenWithdrawAmountChanged(e.target.value));
                console.log("changing....");
              }}
              className="form-control form-control-sm bg-dark text-white"
              required
            />
          </div>
          <div className="col-12 col-sm-auto pl-sm-0">
            <button type="submit" className="btn btn-primary btn-block btn-sm">
              Withdraw
            </button>
          </div>
        </form>
      </Tab>
    </Tabs>
  );
};

export class Balance extends Component {
  componentDidMount() {
    console.log("balance props init:", this.props.account);
    const interval = setInterval(
      function() {
        console.log("balance props check:", this.props.account);
        if (this.props.account) {
          this.loadBlockchainData();
          console.log("balance props ready:", this.props.account);
          console.log("ready to clear interval");
          clearInterval(interval);
          return;
        }
      }.bind(this),
      10
    );
  }

  async loadBlockchainData() {
    const { dispatch, web3, exchange, token, account } = this.props;
    await loadBalances(dispatch, web3, exchange, token, account);
  }

  render() {
    return (
      <div className="card bg-dark text-white">
        <div className="card-header">Balance</div>
        <div className="card-body">
          {this.props.showForm ? showForm(this.props) : <Spinner />}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const balancesLoading = balanceLoadingSelector(state);
  return {
    web3: web3Selector(state),
    exchange: exchangeSelector(state),
    token: tokenSelector(state),
    account: accountSelector(state),
    etherBalance: etherBalanceSelector(state),
    tokenBalance: tokenBalanceSelector(state),
    exchangeEtherBalance: exchangeEtherBalanceSelector(state),
    exchangeTokenBalance: exchangeTokenBalanceSelector(state),
    balancesLoading,
    showForm: !balancesLoading,
    etherDepositAmount: etherDepositAmountSelector(state),
    etherWithdrawAmount: etherWithdrawAmountSelector(state),
    tokenDepositAmount: tokenDepositAmountSelector(state),
    tokenWithdrawAmount: tokenWithdrawAmountSelector(state),
  };
}

export default connect(mapStateToProps)(Balance);
