const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

const wait = (sec) => {
  const millisec = sec * 1000;
  return new Promise((resolve) => setTimeout(resolve, millisec));
};

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();

    const token = await Token.deployed();
    console.log("deployed token contract   ", token.address);

    const exchange = await Exchange.deployed();
    console.log("exchange deployed contract  ", exchange.address);

    // transfer tokens to receiver

    const sender = accounts[0];
    const receiver = accounts[1];

    let amount = web3.utils.toWei("1000", "ether");

    await token.transfer(receiver, amount, { from: sender });
    console.log(`Transfered ${amount} from ${sender} to ${receiver}`);

    // users for the exchange

    const user1 = accounts[0];
    const user2 = accounts[1];

    amount = web3.utils.toWei("100", "ether");
    let amountEth = web3.utils.toWei("2", "ether");
    // user1 deposits ether

    await exchange.depositEther({ from: user1, value: amountEth });
    console.log("user1 has deposited :%d ether", amountEth);

    // user2 deposits a token
    await token.approve(exchange.address, amount, { from: user2 });
    console.log("user2 has approved :%d", amount);

    await exchange.depositToken(token.address, amount, { from: user2 });
    console.log("user2 has deposited :%d", amount);

    // //////////////////////////////////////////
    /// seed cancelled orders by user1
    const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
    let result;
    let orderId;
    let tokens2Buy = web3.utils.toWei("9", "ether");
    let eth2Give = web3.utils.toWei("0.01", "ether");
    result = await exchange.makeOrder(
      token.address,
      tokens2Buy,
      ETH_ADDRESS,
      eth2Give,
      { from: user1 }
    );

    console.log("order made by :%d", user1);

    // user 1 cancels oder
    orderId = result.logs[0].args.id;
    await exchange.cancelOrder(orderId, { from: user1 });

    console.log("order cancelled by user1 :%d", user1);

    // //////////////////////////////////////////////////////////////////
    // ///// seed make and fill orders  let tokens2Buy = web3.utils.toWei("9", "ether");
    // let eth2Give = web3.utils.toWei("0.1", "ether");

    // user1 makes an order
    result = await exchange.makeOrder(
      token.address,
      tokens2Buy,
      ETH_ADDRESS,
      eth2Give,
      { from: user1 }
    );
    console.log("order made by :%d", user1);

    //   user 2 fills the order
    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });

    console.log("Filled by user 2 :%d", user2);

    await wait(1);

    // user1 makes an order
    tokens2Buy = web3.utils.toWei("5", "ether");
    eth2Give = web3.utils.toWei("0.01", "ether");
    result = await exchange.makeOrder(
      token.address,
      tokens2Buy,
      ETH_ADDRESS,
      eth2Give,
      { from: user1 }
    );
    console.log("order made by :%d", user1);

    //   user 2 fills the order
    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });

    console.log("Filled by user 2 :%d", user2);

    await wait(1);

    // user1 makes an order
    tokens2Buy = web3.utils.toWei("20", "ether");
    eth2Give = web3.utils.toWei("0.15", "ether");
    result = await exchange.makeOrder(
      token.address,
      tokens2Buy,
      ETH_ADDRESS,
      eth2Give,
      { from: user1 }
    );
    console.log("order made by :%d", user1);

    //   user 2 fills the order
    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });

    console.log("Filled by user 2 :%d", user2);

    await wait(1);

    // //////////////////////////////////////////////////////////////////
    // ///// seed make open orders
    // user 1 make 10 trades
    for (let i = 0; i <= 10; i++) {
      tokens2Buy = web3.utils.toWei((10 * i).toString(), "ether");
      result = await exchange.makeOrder(
        token.address,
        tokens2Buy,
        ETH_ADDRESS,
        eth2Give,
        { from: user1 }
      );
      console.log("order made by :%d", user1);
      await wait(1);
    }

    for (let i = 0; i <= 10; i++) {
      tokens2Buy = web3.utils.toWei((10 * i).toString(), "ether");
      result = await exchange.makeOrder(
        ETH_ADDRESS,
        eth2Give,
        token.address,
        tokens2Buy,

        { from: user2 }
      );
      console.log("order made by :%d", user2);
      await wait(1);
    }
  } catch (err) {
    console.log(err);
  }
  callback();
};
