import { get, groupBy, reject, maxBy, minBy } from "lodash";
import { createSelector } from "reselect";
import {
  ETHER_ADDRESS,
  tokens,
  GREEN,
  RED,
  ether,
  formatBalance,
} from "../helpers";
import moment from "moment";

const account = (state) => get(state, "web3.account");
export const accountSelector = createSelector(account, (a) => a);

const web3 = (state) => get(state, "web3.connection");
export const web3Selector = createSelector(web3, (c) => c);

const tokenLoaded = (state) => get(state, "token.loaded");
const tokenLoadedSelector = createSelector(tokenLoaded, (tl) => tl);

const token = (state) => get(state, "token.contract");
export const tokenSelector = createSelector(token, (e) => e);

const exchangeLoaded = (state) => get(state, "exchange.loaded");
const exchangeLoadedSelector = createSelector(exchangeLoaded, (el) => el);

const exchange = (state) => get(state, "exchange.contract");
export const exchangeSelector = createSelector(exchange, (e) => e);

export const contractsLoaded = createSelector(
  tokenLoadedSelector,
  exchangeLoadedSelector,
  (tl, el) => tl && el
);

// allOrders
const allOrdersLoaded = (state) =>
  get(state, "exchange.allOrders.loaded", false);
const allOrders = (state) => get(state, "exchange.allOrders.data");

// cancelled orders
const cancelledOrdersLoaded = (state) =>
  get(state, "exchange.cancelledOrders.loaded", false);
export const cancelledOrdersLoadedSelector = createSelector(
  cancelledOrdersLoaded,
  (loaded) => loaded
);

const cancelledOrders = (state) => get(state, "exchange.cancelledOrders.data");
export const cancelledOrdersSelectors = createSelector(
  cancelledOrders,
  (o) => o
);

// filled orders
const filledOrdersLoaded = (state) =>
  get(state, "exchange.tradeOrders.loaded", false);
export const filledOrdersLoadedSelector = createSelector(
  filledOrdersLoaded,
  (loaded) => loaded
);

const filledOrders = (state) => get(state, "exchange.tradeOrders.data", []);
export const filledOrderSelector = createSelector(filledOrders, (orders) => {
  // this sort order is in position sort no new copy is made.
  // sort if you start with ascedning and end with descending
  // sort orders in ascending order
  orders = orders.sort((a, b) => a.timestamp - b.timestamp);
  orders = decorateFilledOrders(orders);
  // sort the orders in descending order
  orders = orders.sort((a, b) => b.timestamp - a.timestamp);
  return orders;
});

const decorateFilledOrders = (orders) => {
  let previousOrder = orders[0];
  return orders.map((order) => {
    order = decorateOrder(order);
    order = decorateFilledOrder(order, previousOrder);
    previousOrder = order;
    return order;
  });
};

const decorateOrder = (order) => {
  let etherAmount;
  let tokenAmount;

  if (order.tokenGive === ETHER_ADDRESS) {
    etherAmount = order.amountGive;
    tokenAmount = order.amountGet;
  } else {
    etherAmount = order.amountGet;
    tokenAmount = order.amountGive;
  }

  const precision = 100000;
  let tokenPrice = etherAmount / tokenAmount;
  tokenPrice = Math.round(tokenPrice * precision) / precision;
  return {
    ...order,
    tokenPrice,
    etherAmount: ether(etherAmount),
    tokenAmount: tokens(tokenAmount),
    formattedTimestamp: moment.unix(order.timestamp).format("h:mm:ss a M/D"),
  };
};

const decorateFilledOrder = (order, previousOrder) => {
  return {
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder),
  };
};

const tokenPriceClass = (tokenPrice, id, previousOrder) => {
  if (previousOrder.id === id) {
    return GREEN;
  }
  // show green if price is higher than previous
  // show red if price is lower than previous
  if (previousOrder.tokenPrice > tokenPrice) {
    return RED;
  } else if (previousOrder.tokenPrice < tokenPrice) {
    return GREEN;
  }
};

const openOrders = (state) => {
  const all = allOrders(state);
  const filled = filledOrders(state);
  const cancelled = cancelledOrders(state);

  const openOrders = reject(all, (order) => {
    const orderFilled = filled.some((o) => o.id === order.id);
    const orderCancelled = cancelled.some((o) => o.id === order.id);

    return orderFilled || orderCancelled;
  });

  return openOrders;
};

const decorateOrderBookOrders = (orders) => {
  return orders.map((order) => {
    order = decorateOrder(order);
    order = decorateOrderBookOrder(order);

    // ddo more
    return order;
  });
};

const decorateOrderBookOrder = (order) => {
  const orderType = order.tokenGive === ETHER_ADDRESS ? "buy" : "sell";
  return {
    ...order,
    orderType,
    orderTypeClass: orderType === "buy" ? GREEN : RED,
    orderFillAction: orderType === "buy" ? "sell" : "buy",
  };
};

//  order Book
const orderBookLoaded = (state) =>
  allOrdersLoaded(state) &&
  cancelledOrdersLoaded(state) &&
  filledOrdersLoaded(state);

export const orderBookLoadedSelector = createSelector(
  orderBookLoaded,
  (tl) => tl
);

// create order book
export const orderBookSelector = createSelector(openOrders, (orders) => {
  // decorate open orders
  orders = decorateOrderBookOrders(orders);
  // GROUP ORDERS BY ORDER TYPE
  orders = groupBy(orders, "orderType");

  const buyOrders = get(orders, "buy", []);
  orders = {
    ...orders,
    buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice),
  };
  const sellOrders = get(orders, "sell", []);
  orders = {
    ...orders,
    sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice),
  };
  return orders;
});

// my trades -trades
export const myFilledOrdersLoadedSelector = createSelector(
  filledOrdersLoaded,
  (loaded) => loaded
);

export const myFilledOrdersSelector = createSelector(
  account,
  filledOrders,

  (account, filledOrders) => {
    let orders = filledOrders;

    // find out orders
    orders = orders.filter(
      (order) => order.user === account || order.userFill === account
    );

    // sort orders
    orders = orders.sort((a, b) => a.timestamp - b.timestamp);

    orders = decorateMyFilledOrders(orders, account);

    return orders;
  }
);

const decorateMyFilledOrders = (orders, account) => {
  return orders.map((order) => {
    order = decorateOrder(order);
    order = decorateMyFilledOrder(order, account);
    return order;
  });
};

const decorateMyFilledOrder = (order, account) => {
  const myOrder = order.user === account;
  let orderType;

  if (myOrder) {
    orderType = order.tokenGive === ETHER_ADDRESS ? "buy" : "sell";
  } else {
    orderType = order.tokenGive === ETHER_ADDRESS ? "sell" : "sell";
  }
  return {
    ...order,
    orderType,
    orderTypeClass: orderType === "buy" ? GREEN : RED,
    orderSign: orderType === "buy" ? "+" : "-",
  };
};

// my open orders
export const myOpenOrdersLoadedSelector = createSelector(
  orderBookLoaded,
  (loaded) => loaded
);

export const myOpenOrdersSelector = createSelector(
  account,
  openOrders,

  (account, orders) => {
    // find out orders
    orders = orders.filter(
      (order) => order.user === account || order.userFill === account
    );

    // sort orders
    orders = orders.sort((a, b) => a.timestamp - b.timestamp);

    orders = decorateMyOpenOrders(orders, account);

    return orders;
  }
);

const decorateMyOpenOrders = (orders, account) => {
  return orders.map((order) => {
    order = decorateOrder(order);
    order = decorateMyOpenOrder(order, account);
    return order;
  });
};

const decorateMyOpenOrder = (order, account) => {
  let orderType = order.tokenGive === ETHER_ADDRESS ? "buy" : "sell";
  return {
    ...order,
    orderType,
    orderTypeClass: orderType === "buy" ? GREEN : RED,
  };
};

/*
 selectors for the candle stick chart

*/

export const priceChartLoadedSelector = createSelector(
  filledOrdersLoaded,
  (loaded) => loaded
);

export const priceChartSelector = createSelector(filledOrders, (orders) => {
  // Sort orders by date ascending to compare history
  orders = orders.sort((a, b) => a.timestamp - b.timestamp);

  // orders = orders.sort((a,b) => a.timestamp - b.timestamp)

  // Decorate orders - add display attributes
  orders = orders.map((o) => decorateOrder(o));

  // Get last 2 order for final price & price change
  let secondLastOrder, lastOrder;
  [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length);

  // get last order price
  const lastPrice = get(lastOrder, "tokenPrice", 0);

  // get second last order price
  const secondLastPrice = get(secondLastOrder, "tokenPrice", 0);

  return {
    lastPrice,
    lastPriceChange: lastPrice >= secondLastPrice ? "+" : "-",
    series: [
      {
        data: buildGraphData(orders),
      },
    ],
  };
});

const buildGraphData = (orders) => {
  // Group the orders by hour for the graph
  orders = groupBy(orders, (o) =>
    moment
      .unix(o.timestamp)
      .startOf("hour")
      .format()
  );
  // Get each hour where data exists
  const hours = Object.keys(orders);
  // Build the graph series
  const graphData = hours.map((hour) => {
    // Fetch all the orders from current hour
    const group = orders[hour];
    // Calculate price values - open, high, low, close
    const open = group[0]; // first order
    const high = maxBy(group, "tokenPrice"); // high price
    const low = minBy(group, "tokenPrice"); // low price
    const close = group[group.length - 1]; // last order

    return {
      x: new Date(hour),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice],
    };
  });

  return graphData;
};

// order cancelling sleector
const orderCancelling = (state) =>
  get(state, "exchange.orderCancelling", false);
export const orderCancellingSelector = createSelector(
  orderCancelling,
  (status) => status
);

// order cancelling sleector
const orderFilling = (state) => get(state, "exchange.orderFilling", false);

export const orderFillingSelector = createSelector(
  orderFilling,
  (status) => status
);

// CHECK FOR BALANCE LOADING
const balanceLoading = (state) => get(state, "exchange.balancesLoading", true);
export const balanceLoadingSelector = createSelector(balanceLoading, (b) => b);

const exchangeEtherBalance = (state) => get(state, "exchange.etherBalance", 0);
export const exchangeEtherBalanceSelector = createSelector(
  exchangeEtherBalance,
  (balance) => {
    balance = formatBalance(balance);

    return balance;
  }
);

const exchangeTokenBalance = (state) => get(state, "exchange.tokenBalance", 0);
export const exchangeTokenBalanceSelector = createSelector(
  exchangeTokenBalance,
  (balance) => {
    balance = formatBalance(balance);

    return balance;
  }
);

const etherBalance = (state) => get(state, "web3.balance", 0);
export const etherBalanceSelector = createSelector(etherBalance, (balance) => {
  balance = formatBalance(balance);

  return balance;
});

const tokenBalance = (state) => get(state, "token.balance", 0);
export const tokenBalanceSelector = createSelector(tokenBalance, (balance) => {
  balance = formatBalance(balance);

  return balance;
});

// get deposit amount
const etherDepositAmount = (state) =>
  get(state, "exchange.etherDepositAmount", null);
export const etherDepositAmountSelector = createSelector(
  etherDepositAmount,
  (amount) => amount
);

// get withdraw amount
const etherWithdrawAmount = (state) =>
  get(state, "exchange.etherWithdrawAmount", null);
export const etherWithdrawAmountSelector = createSelector(
  etherWithdrawAmount,
  (amount) => amount
);

// get deposit amount
const tokenDepositAmount = (state) =>
  get(state, "exchange.tokenDepositAmount", null);
export const tokenDepositAmountSelector = createSelector(
  tokenDepositAmount,
  (amount) => amount
);

// get withdraw amount
const tokenWithdrawAmount = (state) =>
  get(state, "exchange.tokenWithdrawAmount", null);
export const tokenWithdrawAmountSelector = createSelector(
  tokenWithdrawAmount,
  (amount) => amount
);

// making order
const buyOrder = (state) => get(state, "exchange.buyOrder", {});
export const buyOrderSelector = createSelector(buyOrder, (order) => order);

const sellOrder = (state) => get(state, "exchange.sellOrder", {});
export const sellOrderSelector = createSelector(sellOrder, (order) => order);
