pragma solidity ^0.5.0;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
// TO DO
// []Set the fee
// [] deposit ether
// []withdraw ether
// [] deposit tokens
// []widthdraw tokens
// []check balances
// [] make orders
// []cancel orders
// []fill orders
// [] charge fees

import "./Token.sol";

contract Exchange {
    using SafeMath for uint256;
    address public feeAccount;
    uint256 public feePercent;
    address constant ETHER = address(0);
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    uint256 public orderCounter;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;
    // events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );

    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFilled,
        uint256 timestamp
    );

    // Structs
    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }

    // a way to model an order
    // a way to store the order
    // add the order to storage
    constructor(address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    function() external {
        revert();
    }

    function depositEther() public payable {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    // TO DO IMPLEMENT WITHDRAW ETHER
    function withdrawEther(uint256 _amount) public {
        require(_amount <= tokens[ETHER][msg.sender]);
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        msg.sender.transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint256 _amount) public {
        require(_token != ETHER);
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);

        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(_token != ETHER);
        require(tokens[_token][msg.sender] >= _amount);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        orderCounter++;
        orders[orderCounter] = _Order(
            orderCounter,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            now
        );

        emit Order(
            orderCounter,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            now
        );
    }

    function cancelOrder(uint256 _id) public {
        _Order storage _refOrder = orders[_id];

        require(address(_refOrder.user) == msg.sender);

        require(_refOrder.id == _id);
        orderCancelled[_id] = true;

        emit Cancel(
            _refOrder.id,
            _refOrder.user,
            _refOrder.tokenGet,
            _refOrder.amountGet,
            _refOrder.tokenGive,
            _refOrder.amountGive,
            _refOrder.timestamp
        );
    }

    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCounter,'Error, wrong id');
        require(!orderCancelled[_id],'Error, order already filled');
        require(!orderFilled[_id], 'Error, order already cancelled');
        _Order storage _fetchedOrder = orders[_id];
        _trade(
            _fetchedOrder.id,
            _fetchedOrder.user,
            _fetchedOrder.tokenGet,
            _fetchedOrder.amountGet,
            _fetchedOrder.tokenGive,
            _fetchedOrder.amountGive
        );

        orderFilled[_id] = true;
    }

    function _trade(
        uint256 _orderId,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) internal {
        // called by person who fills the order.
        // check to user and callers have balances greater than the one they want toGive
        uint256 _feeAmount = _amountGet.mul(feePercent).div(100);
        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(
            _amountGet.add(_feeAmount)
        );
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);

        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(
            _feeAmount
        );
        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(
            _amountGive
        );

        emit Trade(
            _orderId,
            _user,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            msg.sender,
            now
        );
    }
}
