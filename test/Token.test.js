const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();
const web3 = require("web3");

contract("Token", (accounts) => {
  let token;
  const name = "Smepo Token";
  const totalSupply = "1000000000000000000000000";
  const symbol = "MEP";
  const decimal = "18";

  beforeEach(async () => {
    token = await Token.new();
  });
  describe("deployment", () => {
    it("tracks the name", async () => {
      const result = await token.name();

      result.should.equal(name);
    });

    it("tracks symbol", async () => {
      const results = await token.symbol();
      results.should.equal(symbol);
    });

    it("tracks the decimal", async () => {
      const results = await token.decimal();
      results.toString().should.equal(decimal);
    });

    it("tracks the total supply", async () => {
      const results = await token.totalSupply();
      results.toString().should.equal(totalSupply);
    });

    it("assigns totalsupply to deployer", async () => {
      const results = await token.balanceOf(accounts[0]);
      results.toString().should.equal(totalSupply);
    });
  });

  describe("success", () => {
    let result;
    let amount = "100";
    beforeEach(async () => {
      token = await Token.new();
      result = await token.transfer(
        accounts[1],
        web3.utils.toWei(amount, "ether")
      );
    });
    it("transfers balance", async () => {
      let balance;
      balance = await token.balanceOf(accounts[0]);

      balance = await token.balanceOf(accounts[1]);

      balance = await token.balanceOf(accounts[0]);
      balance.toString().should.equal(web3.utils.toWei("999900", "ether"));

      balance = await token.balanceOf(accounts[1]);
      balance.toString().should.equal(web3.utils.toWei("100", "ether"));
    });

    // event Transfer(address indexed from, address indexed to, uint256 value);
    it("emits a transfer event", async () => {
      const log = result.logs[0];

      const event = log.args;

      event.from.should.eq(accounts[0], "from is correct");
      event.to.should.eq(accounts[1], "to is correct");
      event.value
        .toString()
        .should.eq(web3.utils.toWei(amount, "ether"), "amount is correct");
    });
  });

  describe("failure", () => {
    let invalidAmount = web3.utils.toWei("100000000", "ether");
    let amount = web3.utils.toWei("100", "ether");
    it("fails on insufficient balance", async () => {
      await token
        .transfer(accounts[1], invalidAmount)
        .should.be.rejectedWith(
          "VM Exception while processing transaction: revert"
        );

      await token
        .transfer(accounts[0], invalidAmount, { from: accounts[4] })
        .should.be.rejectedWith(
          "VM Exception while processing transaction: revert"
        );
    });
    it("fails on invalid address", async () => {
      await token
        .transfer(0x0, amount)
        .should.be.rejectedWith(
          'invalid address (arg="_to", coderType="address", value=0)'
        );
    });
  });

  describe("approving tokens", () => {
    let results;
    let amount;

    beforeEach(async () => {
      amount = web3.utils.toWei("100", "ether");
      results = await token.approve(accounts[5], amount, { from: accounts[0] });
    });

    describe("sucess", () => {
      it("allocates an allowance for delegated token spending", async () => {
        const allowance = await token.allowance(accounts[0], accounts[5]);

        allowance.toString().should.eq(amount);
      });

      it("emits an Approval event", async () => {
        const log = results.logs[0];

        log.event.should.equal("Approval");
        const eventArgs = log.args;

        eventArgs.owner.should.eq(accounts[0], "owner is correct");
        eventArgs.spender.should.eq(accounts[5], "spender is correct");
        eventArgs.value.toString().should.eq(amount, "amount is correct");
      });
    });

    describe("failure", () => {
      it("rejects invalid spenders", async () => {
        await token.approve(0x0, amount, { from: accounts[0] }).should.be
          .rejected;
      });
    });
  });
});
