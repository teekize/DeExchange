const Exchange = artifacts.require("./Exchange");
const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();
const web3 = require("web3");

contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
  let exchange;
  let token;
  const feePercent = 10;

  beforeEach(async () => {
    exchange = await Exchange.new(feeAccount, feePercent);
    token = await Token.new();
    token.transfer(user1, web3.utils.toWei("100", "ether"), { from: deployer });
  });
  describe("deployment", () => {
    it("sets the feeAccount", async () => {
      const result = await exchange.feeAccount();

      result.should.equal(feeAccount);
    });

    it("sets the fee percent", async () => {
      const result = await exchange.feePercent();

      result.toString().should.equal(feePercent.toString());
    });
  });

  describe("deposit token", () => {
    let transferAmount = web3.utils.toWei("10", "ether");
    let results;

    describe("success", () => {
      beforeEach(async () => {
        await token.approve(exchange.address, transferAmount, {
          from: deployer,
        });
        results = await exchange.depositToken(token.address, transferAmount);
      });
      it("tracks token balance", async () => {
        let balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(transferAmount);
        balance = await exchange.tokens(token.address, deployer);
        balance.toString().should.equal(transferAmount);

        //   result.should.equal(feeAccount);
      });

      it("emits an Approval event", async () => {
        const log = results.logs[0];

        log.event.should.equal("Deposit");
        const eventArgs = log.args;

        eventArgs.token.should.eq(token.address, "owner is correct");
        eventArgs.user.should.eq(deployer, "spender is correct");
        eventArgs.amount
          .toString()
          .should.eq(transferAmount, "amount is correct");
        eventArgs.balance
          .toString()
          .should.eq(transferAmount, "amount is correct");
      });
    });

    describe("failure", () => {
      it("fails without approval", async () => {
        await exchange
          .depositToken(token.address, transferAmount, { from: deployer })
          .should.be.rejectedWith(
            "VM Exception while processing transaction: revert"
          );
      });
    });
  });

  describe("withdraw token", () => {
    let transferAmount = web3.utils.toWei("1", "ether");
    let results;

    describe("success", () => {
      beforeEach(async () => {
        // approve tokens
        // depositToken
        await token.approve(exchange.address, transferAmount, {
          from: deployer,
        });
        await exchange.depositToken(token.address, transferAmount, {
          from: deployer,
        });
        results = await exchange.withdrawToken(token.address, transferAmount, {
          from: deployer,
        });
      });
      it("withdraws token", async () => {
        let balance;

        balance = await exchange.balanceOf(token.address, deployer);
        balance.toString().should.equal("0");
      });
      it("emits an Withdraw event", async () => {
        const log = results.logs[0];

        log.event.should.equal("Withdraw");
        const eventArgs = log.args;

        eventArgs.token.should.eq(token.address, "token is correct");
        eventArgs.user.should.eq(deployer, "user is correct");
        eventArgs.amount
          .toString()
          .should.eq(transferAmount, "amount is correct");
        eventArgs.balance.toString().should.eq("0", "balance is correct");
      });
    });

    describe("failure", () => {
      it("fails if no balance", async () => {
        results = await exchange
          .withdrawToken(token.address, transferAmount, { from: user1 })
          .should.be.rejectedWith(
            "VM Exception while processing transaction: revert"
          );

        //   result.should.equal(feeAccount);
      });
    });
  });

  describe("deposit ether", () => {
    let transferAmount = web3.utils.toWei("1", "ether");
    let results;
    const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

    describe("success", () => {
      beforeEach(async () => {
        results = await exchange.depositEther({
          from: user1,
          value: web3.utils.toWei("1", "ether"),
        });
      });
      it("tracks ether balance", async () => {
        let balance;
        balance = await exchange.tokens(ETH_ADDRESS, user1);
        balance.toString().should.equal(web3.utils.toWei("1", "ether"));

        //   result.should.equal(feeAccount);
      });

      it("emits an Deposit event", async () => {
        const log = results.logs[0];

        log.event.should.equal("Deposit");
        const eventArgs = log.args;

        eventArgs.token.should.eq(ETH_ADDRESS, "token is correct");
        eventArgs.user.should.eq(user1, "user is correct");
        eventArgs.amount
          .toString()
          .should.eq(transferAmount, "amount is correct");
        eventArgs.balance
          .toString()
          .should.eq(transferAmount, "balance is correct");
      });
    });

    describe("failure", () => {
      it("fails without approval", async () => {
        await exchange
          .depositToken(token.address, transferAmount, { from: deployer })
          .should.be.rejectedWith(
            "VM Exception while processing transaction: revert"
          );
      });
    });
  });

  describe("withdraw ether", () => {
    let transferAmount = web3.utils.toWei("1", "ether");
    let results;
    const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

    describe("success", () => {
      beforeEach(async () => {
        const result = await exchange.depositEther({
          from: user1,
          value: transferAmount,
        });
        results = await exchange.withdrawEther(transferAmount, { from: user1 });
      });
      it("withdraws ether", async () => {
        let balance;

        balance = await exchange.balanceOf(ETH_ADDRESS, user1);
        balance.toString().should.equal("0");
      });
      it("emits an Withdraw event", async () => {
        const log = results.logs[0];

        log.event.should.equal("Withdraw");
        const eventArgs = log.args;

        eventArgs.token.should.eq(ETH_ADDRESS, "token is correct");
        eventArgs.user.should.eq(user1, "user is correct");
        eventArgs.amount
          .toString()
          .should.eq(transferAmount, "amount is correct");
        eventArgs.balance.toString().should.eq("0", "balance is correct");
      });
    });

    describe("failure", () => {
      it("fails if no balance", async () => {
        results = await exchange
          .withdrawEther(transferAmount, { from: user1 })
          .should.be.rejectedWith(
            "VM Exception while processing transaction: revert"
          );

        //   result.should.equal(feeAccount);
      });
    });
  });

  describe("calls balanceof", () => {
    const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

    beforeEach(() => {
      exchange.depositEther({
        from: user2,
        value: web3.utils.toWei("1", "ether"),
      });
    });
    it("calls balance of ", async () => {
      let results = await exchange.balanceOf(ETH_ADDRESS, user2);

      results.toString().should.equal(web3.utils.toWei("1", "ether"));
    });
  });

  describe("orders", () => {
    let results;
    let tokens2Buy = web3.utils.toWei("1", "ether");
    const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
    beforeEach(async () => {
      results = await exchange.makeOrder(
        token.address,
        tokens2Buy,
        ETH_ADDRESS,
        tokens2Buy,
        { from: user2 }
      );
    });

    // uint256 id,
    //     address user,
    //     address tokenGet,
    //     uint256 amountGet,
    //     address tokenGive,
    //     uint256 amountGive,
    //     uint256 timestamp
    it("tracks order created", async () => {
      const orderCount = await exchange.orderCounter();

      const order = await exchange.orders("1");
      //   console.log(orderCount.toString());
      order.id.toString().should.equal("1");
      order.user.should.equal(user2);
      order.tokenGet.should.equal(token.address);
      order.amountGet.toString().should.eq(tokens2Buy);
      order.tokenGive.should.equal(ETH_ADDRESS);
      order.amountGive.toString().should.eq(tokens2Buy);
      order.timestamp.toString().length.should.be.at.least(1);
    });
  });

  describe("order actions", () => {
    describe("cancel orders", () => {
      describe("success ", () => {
        let results;
        let tokens2Buy = web3.utils.toWei("1", "ether");
        const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
        beforeEach(async () => {
          // deposit a token or ether
          // make an order
          results = await exchange.makeOrder(
            token.address,
            tokens2Buy,
            ETH_ADDRESS,
            tokens2Buy,
            { from: user2 }
          );
          // cancel the order
          await exchange.cancelOrder(1, { from: user2 });
        });

        it("cancel orders", async () => {
          const isCancelled = await exchange.orderCancelled(1);
          isCancelled.should.equal(true);
        });
      });

      describe("failure", () => {
        it("fails when sender is not order owner", async () => {
          let response = await exchange
            .cancelOrder(1, { from: deployer })
            .should.be.rejectedWith(
              "VM Exception while processing transaction: revert"
            );
        });
        it("fails on invalid id", async () => {
          let response = await exchange
            .cancelOrder(1000, { from: deployer })
            .should.be.rejectedWith(
              "VM Exception while processing transaction: revert"
            );
        });
      });
    });

    describe("fill orders", () => {
      describe("success", () => {
        let results;
        let orderId;
        const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
        beforeEach(async () => {
          let tokens2Buy = web3.utils.toWei("1", "ether");
          // user2 deposits ether so will pay using Ether
          await exchange.depositEther({ from: user2, value: tokens2Buy });
          tokens2Buy = web3.utils.toWei("100", "ether");

          // user1 & user2 transfer tokens
          await token.transfer(user1, tokens2Buy, { from: deployer });
          await token.transfer(user2, tokens2Buy, { from: deployer });

          // deposit more tokens such that they can cover fees.
          tokens2Buy = web3.utils.toWei("10", "ether");
          await token.approve(exchange.address, tokens2Buy, { from: user1 });
          await exchange.depositToken(token.address, tokens2Buy, {
            from: user1,
          });

          tokens2Buy = web3.utils.toWei("1", "ether");

          // user 2 makes an order to buy Tokens paying with ether
          const response = await exchange.makeOrder(
            token.address,
            tokens2Buy,
            ETH_ADDRESS,
            tokens2Buy,
            { from: user2 }
          );

          orderId = response.logs[0].args.id;
          results = await exchange.fillOrder("1", { from: user1 });
        });

        it("emits a trade event", async () => {
          const log = results.logs[0];
          log.event.should.eq("Trade");
          const event = log.args;
          event.id.toString().should.equal("1", "id is correct");
          event.user.should.equal(user2, "user is correct");
          event.tokenGet.should.equal(token.address, "tokenGet is correct");
          event.amountGet
            .toString()
            .should.equal(
              web3.utils.toWei("1", "ether"),
              "amountGet is correct"
            );
          event.tokenGive.should.equal(ETH_ADDRESS, "tokenGive is correct");
          event.amountGive
            .toString()
            .should.equal(
              web3.utils.toWei("1", "ether"),
              "amountGive is correct"
            );
          event.userFilled.should.equal(user1, "userFill is correct");
          event.timestamp
            .toString()
            .length.should.be.at.least(1, "timestamp is present");
        });
        it("updates filled orders", async () => {
          const orderFilled = await exchange.orderFilled(1);
          orderFilled.should.equal(true);
        });

        it("exceutes the trade and charges fee", async () => {
          let balance;
          const tokens2Buy = web3.utils.toWei("1", "ether");
          balance = await exchange.balanceOf(token.address, feeAccount);
          balance.toString().should.eq(web3.utils.toWei("0.1", "ether"));

          balance = await exchange.balanceOf(token.address, user2);
          balance.toString().should.eq(tokens2Buy, "user2 receveid his tokens");

          balance = await exchange.balanceOf(ETH_ADDRESS, user1);
          balance.toString().should.eq(tokens2Buy, "user1 receveid ether");

          balance = await exchange.balanceOf(ETH_ADDRESS, user2);
          balance
            .toString()
            .should.eq(web3.utils.toWei("0"), "user2 ether was deducted");
        });
      });

      describe("failure", () => {});
    });
  });
});
