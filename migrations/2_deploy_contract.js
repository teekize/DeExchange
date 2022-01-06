const Token = artifacts.require("Token");
const Exhange = artifacts.require("Exchange");
module.exports = async function (deployer) {
  await deployer.deploy(Token);

  const accounts = await web3.eth.getAccounts();
  // get accounts & setup the exchange contract
  const feeAmount = 10;
  const feeAccount = accounts[0];
  await deployer.deploy(Exhange, feeAccount, feeAmount);
};
