pragma solidity ^0.4.18;

//import "./zeppelin/math/SafeMath.sol";

import "./zeppelin/token/ERC20/BurnableToken.sol";
import "./zeppelin/token/ERC20/ERC20.sol";
import "./zeppelin/token/ERC20/BasicToken.sol";
import "./zeppelin/token/ERC20/StandardToken.sol";
import "./zeppelin/token/ERC20/TokenTimelock.sol";
import "./zeppelin/ownership/Ownable.sol";

/**
 * PCO Token, "Pecunio"
 * Features:
 *  - ERC20 compliant
 *  - Lock-Up with variable time/amount (owner only)
 *  - Burn with variable amount (anyone)
 */
contract PCO is StandardToken, BurnableToken, Ownable { 
    
    // Public variables of the token
    string public constant symbol = "PCO";
    string public constant name =  "Pecunio";
    
    uint8 public constant decimals = 8;
    
    // 100.000.000 tokens + 8 DECIMALS = 10^16 units 
    uint256 public constant INITIAL_SUPPLY = 10000000000000000;

    /**
    * Constructor that gives msg.sender all of existing tokens.
    */
    function PCO() public {
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        Transfer(0x0, msg.sender, INITIAL_SUPPLY);
    }

    function transferWithTimeLock(address _to, uint256 _amount, uint256 _releaseTime) onlyOwner returns (TokenTimelock) {
        TokenTimelock timelock = new TokenTimelock(this, _to, _releaseTime);
        transfer(timelock, _amount);
        return timelock;
    }
}