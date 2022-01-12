import "./App.css";
import React, { Component } from "react";
import { connect } from "react-redux";

import {
  loadWeb3,
  loadAccount,
  loadToken,
  loadExchange,
} from "../store/interactions";

import { contractsLoaded } from "../store/selectors";

import Navbar from "./Navbar";
import Content from "./Content";

class App extends Component {
  componentWillMount() {
    this.getBlockData(this.props.dispatch);
  }

  async getBlockData(dispatch) {
    const web3 = loadWeb3(dispatch);

    await web3.eth.net.getNetworkType();

    const netId = await web3.eth.net.getId();

    loadAccount(web3, dispatch);

    // get token abi - get token address - new contract - call method
    const token = loadToken(web3, netId, dispatch);
    if (!token) {
      window.alert(
        "Token smart contract not detected on the current network. Please select another network with Metamask."
      );
      return;
    }
    const exchange = loadExchange(web3, netId, dispatch);
    if (!exchange) {
      window.alert(
        "Exchange smart contract not detected on the current network. Please select another network with Metamask."
      );
      return;
    }
  }

  render() {
    return (
      <div className="bg-cont">
        <Navbar />

        {this.props.isLoaded ? <Content /> : <div className="content"> </div>}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isLoaded: contractsLoaded(state),
  };
}

export default connect(mapStateToProps)(App);
// export default App;
