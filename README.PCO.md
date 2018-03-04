# PCO Token 

## Features

 - Name: Pecunio
 - Symbol: PCO
 - Totol amount of tokens: 100.000.000 (“one hundred millions”)
 - Decimals: 8
 - Maximum number of units: 10.000.000.000.000.000
 - Token Standard: ERC20
 - Additional features:
    - Lock up: Send tokens locked (only contract owner)
    - Burn: Reduce total amount of tokens (only contract owner)

### ERC20
*TODO*

### Burn
```javascript
/**
 * Burns the amount _value from the contract owners account. Only the contract owner can call this function.
 */
function burn(uint256 _value) public ownerOnly returns (bool success)

/**
 * The event Burn is called after burn() is run to inform UI/clients 
 */
event Burn(address indexed from, uint256 value);
```


### Lock-Up
Tokens can be sent with a time lock from the contract owner. The contract stores a conventional balance mapping with the total balances of the users and a separate list with the locked balances of the users. 
```quote
balanceOf[user] == balanceUnlocked[user] + balanceLocked[user]
```
This was implemented this way to guarantee compatibility with the ERC20 standard. The balanceOf() function thus always returns the entire balance of a user - the locked balance can be retrieved with lockedBalanceOf() function. 
