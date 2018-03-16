# PCO Token 

## Features

 - Name: Pecunio
 - Symbol: PCO
 - Totol amount of tokens: 100.000.000 (“one hundred millions”)
 - Decimals: 8
 - Maximum number of units: 10.000.000.000.000.000
 - Token Standard: ERC20
 - Libraries used: Zeppelin, based on commit 108d5f3b4a70aae48ee6666123dab2d4046ffbeb (Feb 16, 2018)
 - Additional features:
    - Lock up: Send tokens locked using TokenTimelock contract from Zeppelin
    - Burn: Reduce total amount of tokens using BurnableToken from Zeppelin


### Burn
The burn mechanism uses the standard implementation of Zeppelin. The amount to burn is subtracted from the burners account as well as from the total supply. 
```javascript
/**
 * @dev Burns a specific amount of tokens.
 * @param _value The amount of token to be burned.
 */
function burn(uint256 _value) public

/**
 * The event Burn is called after burn() is run to inform UI/clients 
 */
event Burn(address indexed from, uint256 value);
```


### Lock-Up
For the lock-up, a TokenTimelock contract is created that holds the tokens until the release time. To release the tokens, the release() function has to be triggered manually. The locked balance of a user will not show up on his balance until the locked amount is released.