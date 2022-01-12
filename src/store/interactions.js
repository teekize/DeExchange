import Web3 from "web3";
import {
  web3Loaded,
  web3AccountLoaded,
  tokenLoaded,
  exchangeLoaded,
  cancelOrdersLoaded,
  tradeOrdersLoaded,
  allOrdersLoaded,
  orderCancelling,
  orderCancelled,
  filledOrder,
  orderFilling,
  exchangeTokenBalanceLoaded,
  exchangeEtherBalanceLoaded,
  tokenBalanceLoaded,
  etherBalanceLoaded,
  balancesLoaded,
  balancesLoading,
  buyOrderMaking,
  sellOrderMaking,
  orderMade,
} from "./actions";
import { ETHER_ADDRESS } from "../helpers";
import Token from "../abis/Token.json";
import Exchange from "../abis/Exchange.json";

export const loadWeb3 = (dispatch) => {
  const connection = new Web3(Web3.givenProvider || "http://localhost:7545");
  dispatch(web3Loaded(connection));
  return connection;
  //   if (window.ethereum) {
  //     try {
  //       // Request account access if needed
  //       askPermission();
  //       dispatch(web3Loaded(web3));
  //       return web3;
  //     } catch (error) {
  //       console.log(error);
  //       // User denied account access...
  //     }
  //   }
  //   // Non-dapp browsers...
  //   else {
  //     window.alert(
  //       "Non-Ethereum browser detected. You should consider trying MetaMask!"
  //     );
  //   }
};

export const loadAccount = async (web3, dispatch) => {
  // TODO add warning message if no accounts found
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  dispatch(web3AccountLoaded(account));
  return account;
};

export const loadToken = async (web3, netId, dispatch) => {
  try {
    const tokenAddres = Token.networks[netId].address;
    const token = new web3.eth.Contract(Token.abi, tokenAddres);
    dispatch(tokenLoaded(token));
    return token;
  } catch (error) {
    console.log(
      "Contract not deployed to the current network. Please select another network with Metamask."
    );
    return null;
  }
};

export const loadExchange = async (web3, netId, dispatch) => {
  try {
    const exchangeAddres = Exchange.networks[netId].address;
    const exchange = new web3.eth.Contract(Exchange.abi, exchangeAddres);
    dispatch(exchangeLoaded(exchange));
    return exchange;
  } catch (error) {
    console.log(
      "Contract not deployed to the current network. Please select another network with Metamask."
    );
    return null;
  }
};

export const loadAllOrders = async (exchange, dispatch) => {
  // fetch cancelled orders with "Cancel" event stream getPastEvents
  const cancelStream = await exchange.getPastEvents("Cancel", {
    fromBlock: 0,
    toBlock: "latest",
  });
  let cancelOrders = cancelStream.map((stream) => stream.returnValues);

  dispatch(cancelOrdersLoaded(cancelOrders));
  // fetch filledorders with "trade" event stream

  const tradeStream = await exchange.getPastEvents("Trade", {
    fromBlock: 0,
    toBlock: "latest",
  });

  let tradeOrders = tradeStream.map((stream) => stream.returnValues);

  dispatch(tradeOrdersLoaded(tradeOrders));

  const orderStream = await exchange.getPastEvents("Order", {
    fromBlock: 0,
    toBlock: "latest",
  });

  let allOrders = orderStream.map((stream) => stream.returnValues);
  dispatch(allOrdersLoaded(allOrders));

  // fetch all orders with "Order" event stream
};

export const cancelOrder = async (dispatch, exchange, order, account) => {
  exchange.methods
    .cancelOrder(order.id)
    .send({ from: account })
    .on("transactionHash", (hash) => {
      // dispatch some action.
      dispatch(orderCancelling());
    })
    .on("error", (error) => {
      console.log(error);
      window.alert("there was an error !");
    });
  // cancel a given order by id
};

export const fillOrder = async (dispatch, exchange, order, account) => {
  exchange.methods
    .fillOrder(order.id)
    .send({ from: account })
    .on("transactionHash", (hash) => {
      dispatch(orderFilling());
    })
    .on("error", (error) => {
      console.log(error);
      window.alert("There was an error!");
    });
};

export const subscribeToEvents = async (exchange, dispatch) => {
  exchange.events.Cancel({}, (error, event) => {
    dispatch(orderCancelled(event.returnValues));
  });

  exchange.events.Trade({}, (error, event) => {
    dispatch(filledOrder(event.returnValues));
  });

  exchange.events.Deposit({}, (error, event) => {
    // Trigger all balances loaded
    dispatch(balancesLoaded());
  });

  exchange.events.Withdraw({}, (error, event) => {
    // Trigger all balances loaded
    dispatch(balancesLoaded());
  });
  exchange.events.Order({}, (error, event) => {
    dispatch(orderMade(event.returnValues));
  });
};

// load balnce get the balance and
// add the balances to state

export const loadBalances = async (
  dispatch,
  web3,
  exchange,
  token,
  account
) => {
  // if (typeof account !== "undefined") {
  // Ether balance in wallet
  const etherBalance = await web3.eth.getBalance(account);
  dispatch(etherBalanceLoaded(etherBalance));

  // Token balance in wallet
  const tokenBalance = await token.methods.balanceOf(account).call();
  dispatch(tokenBalanceLoaded(tokenBalance));

  // Ether balance in exchange
  const exchangeEtherBalance = await exchange.methods
    .balanceOf(ETHER_ADDRESS, account)
    .call();
  dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance));

  // Token balance in exchange
  const exchangeTokenBalance = await exchange.methods
    .balanceOf(token.options.address, account)
    .call();
  dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance));

  // Trigger all balances loaded
  dispatch(balancesLoaded());
};

// deposit ether
export const depositEther = (
  dispatch,
  exchange,
  web3,
  etherDepositAmount,
  account
) => {
  exchange.methods
    .depositEther()
    .send({
      from: account,
      value: web3.utils.toWei(etherDepositAmount, "ether"),
    })
    .on("transactionHash", (hash) => {
      dispatch(balancesLoading());
    })
    .on("error", (error) => {
      console.error(error);
      window.alert(`There was an error!`);
    });
};

// withdraw ether
export const withdrawEther = (dispatch, exchange, web3, amount, account) => {
  exchange.methods
    .withdrawEther(web3.utils.toWei(amount, "ether"))
    .send({
      from: account,
    })
    .on("transactionHash", (hash) => {
      dispatch(balancesLoading());
    })
    .on("error", (error) => {
      console.error(error);
      window.alert(`There was an error!`);
    });
};

// DEPOSIT AND WITHDRAW TOKEN
export const depositToken = (
  dispatch,
  exchange,
  web3,
  token,
  amount,
  account
) => {
  amount = web3.utils.toWei(amount, "ether");

  token.methods
    .approve(exchange.options.address, amount)
    .send({ from: account })
    .on("transactionHash", (hash) => {
      exchange.methods
        .depositToken(token.options.address, amount)
        .send({ from: account })
        .on("transactionHash", (hash) => {
          dispatch(balancesLoading());
        })
        .on("error", (error) => {
          console.error(error);
          window.alert(`There was an error!`);
        });
    });
};

export const withdrawToken = (
  dispatch,
  exchange,
  web3,
  token,
  amount,
  account
) => {
  exchange.methods
    .withdrawToken(token.options.address, web3.utils.toWei(amount, "ether"))
    .send({ from: account })
    .on("transactionHash", (hash) => {
      dispatch(balancesLoading());
    })
    .on("error", (error) => {
      console.error(error);
      window.alert(`There was an error!`);
    });
};

export const makeBuyOrder = (
  dispatch,
  exchange,
  token,
  web3,
  order,
  account
) => {
  const tokenGet = token.options.address;
  const amountGet = web3.utils.toWei(order.amount, "ether");
  const tokenGive = ETHER_ADDRESS;
  const amountGive = web3.utils.toWei(
    (order.amount * order.price).toString(),
    "ether"
  );

  exchange.methods
    .makeOrder(tokenGet, amountGet, tokenGive, amountGive)
    .send({ from: account })
    .on("transactionHash", (hash) => {
      dispatch(buyOrderMaking());
    })
    .on("error", (error) => {
      console.error(error);
      window.alert(`There was an error!`);
    });
};

export const makeSellOrder = (
  dispatch,
  exchange,
  token,
  web3,
  order,
  account
) => {
  const tokenGet = ETHER_ADDRESS;
  const amountGet = web3.utils.toWei(
    (order.amount * order.price).toString(),
    "ether"
  );
  const tokenGive = token.options.address;
  const amountGive = web3.utils.toWei(order.amount, "ether");

  exchange.methods
    .makeOrder(tokenGet, amountGet, tokenGive, amountGive)
    .send({ from: account })
    .on("transactionHash", (hash) => {
      dispatch(sellOrderMaking());
    })
    .on("error", (error) => {
      console.error(error);
      window.alert(`There was an error!`);
    });
};
