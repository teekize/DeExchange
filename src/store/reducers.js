import { combineReducers } from "redux";

function web3(state = {}, action) {
  switch (action.type) {
    case "WEB3_LOADED":
      return { ...state, connection: action.connection };
    case "WEB3_ACCOUNT_LOADED":
      return { ...state, account: action.account };

    case "ETHER_BALANCES_LOADED":
      return {
        ...state,
        balance: action.balance,
      };

    default:
      return state;
  }
}

function token(state = {}, action) {
  switch (action.type) {
    case "TOKEN_LOADED":
      return { ...state, loaded: true, contract: action.contract };

    case "TOKEN_BALANCES_LOADED":
      return {
        ...state,
        balance: action.balance,
      };
    default:
      return state;
  }
}

function exchange(state = {}, action) {
  let index;
  switch (action.type) {
    case "EXCHANGE_LOADED":
      return { ...state, loaded: true, contract: action.contract };

    case "CANCELLED_ORDERS_LOADED":
      return {
        ...state,
        cancelledOrders: { loaded: true, data: action.cancelledOrders },
      };

    case "TRADE_ORDERS_LOADED":
      return {
        ...state,
        tradeOrders: { loaded: true, data: action.tradeOrders },
      };

    case "ALL_ORDERS_LOADED":
      return { ...state, allOrders: { loaded: true, data: action.allOrders } };

    case "ORDER_CANCELLING":
      return { ...state, orderCancelling: true };

    case "ORDER_CANCELLED":
      return {
        ...state,
        orderCancelling: false,
        cancelledOrders: {
          ...state.cancelledOrders,
          data: [...state.cancelledOrders.data, action.order],
        },
      };

    case "ORDER_FILLED":
      // Prevent duplicate orders
      let index = state.tradeOrders.data.findIndex(
        (order) => order.id === action.order.id
      );

      if (index === -1) {
        let data = [...state.tradeOrders.data, action.order];
      } else {
        let data = state.tradeOrders.data;
      }

      return {
        ...state,
        orderFilling: false,
        tradeOrders: {
          ...state.tradeOrders,
          data: [...state.tradeOrders.data, action.order],
        },
      };

    case "ORDER_FILLING":
      return {
        ...state,
        orderFilling: true,
      };

    case "BALANCES_LOADED":
      return {
        ...state,
        balancesLoading: false,
      };

    case "BALANCES_LOADING":
      return {
        ...state,
        balancesLoading: true,
      };

    case "EXCHANGE_TOKEN_BALANCES_LOADED":
      return {
        ...state,
        tokenBalance: action.balance,
      };

    case "EXCHANGE_ETHER_BALANCES_LOADED":
      return {
        ...state,
        etherBalance: action.balance,
      };

    case "ETHER_DEPOSIT_AMOUNT_CHANGED":
      return {
        ...state,
        etherDepositAmount: action.amount,
      };

    case "ETHER_WITHDRAW_AMOUNT_CHANGED":
      return {
        ...state,
        etherWithdrawAmount: action.amount,
      };

    case "TOKEN_DEPOSIT_AMOUNT_CHANGED":
      return {
        ...state,
        tokenDepositAmount: action.amount,
      };

    case "TOKEN_WITHDRAW_AMOUNT_CHANGED":
      return {
        ...state,
        tokenWithdrawAmount: action.amount,
      };

    case "BUY_ORDER_AMOUNT_CHANGED":
      return {
        ...state,
        buyOrder: { ...state.buyOrder, amount: action.amount },
      };
    case "BUY_ORDER_PRICE_CHANGED":
      return { ...state, buyOrder: { ...state.buyOrder, price: action.price } };
    case "BUY_ORDER_MAKING":
      return {
        ...state,
        buyOrder: {
          ...state.buyOrder,
          amount: null,
          price: null,
          making: true,
        },
      };

    case "ORDER_MADE":
      // Prevent duplicate orders
      let data;
      index = state.allOrders.data.findIndex(
        (order) => order.id === action.order.id
      );

      if (index === -1) {
        data = [...state.allOrders.data, action.order];
      } else {
        data = state.allOrders.data;
      }

      return {
        ...state,
        allOrders: {
          ...state.allOrders,
          data,
        },
        buyOrder: {
          ...state.buyOrder,
          making: false,
        },
        sellOrder: {
          ...state.sellOrder,
          making: false,
        },
      };

    case "SELL_ORDER_AMOUNT_CHANGED":
      return {
        ...state,
        sellOrder: { ...state.sellOrder, amount: action.amount },
      };
    case "SELL_ORDER_PRICE_CHANGED":
      return {
        ...state,
        sellOrder: { ...state.sellOrder, price: action.price },
      };
    case "SELL_ORDER_MAKING":
      return {
        ...state,
        sellOrder: {
          ...state.sellOrder,
          amount: null,
          price: null,
          making: true,
        },
      };

    default:
      return state;
  }
}

const rootReducer = combineReducers({
  web3,
  token,
  exchange,
});

export default rootReducer;
