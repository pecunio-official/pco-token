pragma solidity ^0.4.16;

import "./zeppelin/math/SafeMath.sol";

interface tokenRecipient { function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) public; }


/**
 * PCO Token, "Pecunio"
 * Features:
 *  - ERC20 compliant
 *  - Lock-Up with variable time/amount (owner only)
 *  - Burn with variable amount (owner only)
 */
contract PCO { 
    
    using SafeMath for uint256;
    
    /**
      * @param expiryDate the unix timestamp when the lock expires
      * @param value the amount of tokens
      */
    struct TimeLockedAmount {
        uint256 value;
        uint256 expiryDate;
    }

    // Public variables of the token
    string public constant symbol = "PCO";
    string public constant name =  "Pecunio";

    uint8 public constant DECIMALS = 8;
    
    // 100.000.000 tokens + 8 DECIMALS = 10^16 units 
    uint256 public totalSupply = 10000000000000000;

    mapping (address => mapping (address => uint256)) public allowance;


    // This creates an array with all balances
    mapping (address => uint256) public balanceOf;
    mapping (address => TimeLockedAmount[]) public balanceOfLocked;


    //mapping of addresses and their expiry <owner, <expiry, amount>>
    //mapping (address => Expiry[]) balanceOfExpiry;

    // initially contract creator
    address public owner;

    // This generates a public event on the blockchain that will notify clients
    event Transfer(address indexed from, address indexed to, uint256 value);

    // This notifies clients about the amount burnt
    event Burn(address indexed from, uint256 value);

    /**
     * Constructor function
     * Contract owner is assigned all the tokens
     */
    function PCO () public {
        balanceOf[msg.sender] = totalSupply;
        owner = msg.sender;
    }


    /**
     * Returns two arrays, the first containing the expiry dates, the second 
     * the values that are tied to this expiry date.
     * The last value indicates the total currently locked tokens
     */
    function lockedBalanceOf(address _from) public view returns (uint256[] values, uint256[] expiries, uint256 sum) {
        TimeLockedAmount[] memory lockedBalances = balanceOfLocked[_from];
        
        uint256[] memory value = new uint256[](lockedBalances.length);
        uint256[] memory expiry = new uint256[](lockedBalances.length);
        uint256 totalLockedCoins = 0;

        //create output format (array of value, array of expiry, sum of values)
        for (uint i = 0; i < lockedBalances.length; i++) {
            TimeLockedAmount memory tla = balanceOfLocked[_from][i];

            if (tla.expiryDate >= now) {
                value[i] = tla.value;
                expiry[i] = tla.expiryDate;
                totalLockedCoins = totalLockedCoins.add(tla.value);
            }
        }
        
        return (value, expiry, totalLockedCoins);
    }

    

    /**
     * Internal transfer, only can be called by this contract
     */
    function _transfer(address _from, address _to, uint _value) internal {
        // Prevent transfer to 0x0 address. Use burn() instead
        require(_to != 0x0);

        //get locked balance
        var ( , ,lockedBalance) = lockedBalanceOf(_from);
        
        // Check if the sender has enough and if enough is unlocked
        require(balanceOf[_from].sub(lockedBalance) >= _value);
        
        // Check for overflows
        require(balanceOf[_to].add(_value) > balanceOf[_to]);
        
        // Save this for an assertion in the future
        uint previousBalances = balanceOf[_from].add(balanceOf[_to]);
        
        // Subtract from the sender
        balanceOf[_from] = balanceOf[_from].sub(_value);
        
        // Add the same to the recipient
        balanceOf[_to] = balanceOf[_to].add(_value);
        
        Transfer(_from, _to, _value);
        
        // Asserts are used to use static analysis to find bugs in your code. They should never fail
        assert(balanceOf[_from].add(balanceOf[_to]) == previousBalances);
    }

    /**
     * Transfer tokens
     *
     * Send `_value` tokens to `_to` from your account
     *
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transfer(address _to, uint256 _value) public {
        _transfer(msg.sender, _to, _value);
    }


    function transferWithTimeLock(address _to, uint256 _value, uint _expiry) public {
        // Prevent transfer to 0x0 address. Use burn() instead
        address _from = msg.sender;

        // Check if address is not 0
        require(_to != 0x0);

        var ( , ,lockedBalance) = lockedBalanceOf(_from);

        // Check if the sender has enough and if enough is unlocked
        require(balanceOf[_from].sub(lockedBalance) >= _value);
        
        // Check for overflows
        require(balanceOf[_to].add(_value) > balanceOf[_to]);
        
        // make sure, the expiry date is in the future
        require(_expiry >= now);

        // Save this for an assertion in the future
        uint previousBalances = balanceOf[_from].add(balanceOf[_to]);
        
        // Subtract from the sender
        balanceOf[_from] = balanceOf[_from].sub(_value);
        
        // Add the same to the recipient
        balanceOf[_to] = balanceOf[_to].add(_value);
        
        // Add to locked balance of user
        balanceOfLocked[_to].push(TimeLockedAmount(_value, now));
        Transfer(_from, _to, _value);

        // Asserts are used to use static analysis to find bugs in your code. They should never fail
        assert(balanceOf[_from].add(balanceOf[_to]) == previousBalances);
    }

    

    /** Get the account balance of another account with address _owner */
    function balanceOf(address _owner) constant public returns (uint256 balance) {
        return balanceOf[_owner];
    }

    /**
     * Destroy tokens
     *
     * Remove `_value` tokens from the system irreversibly
     *
     * @param _value the amount of money to burn
     */
    function burn(uint256 _value) public ownerOnly returns (bool success) {
        // Check if the sender has enough
        require(balanceOf[msg.sender] >= _value);   
        
        // Subtract from the sender
        balanceOf[msg.sender] = balanceOf[msg.sender].sub(_value);            
        
        // Updates totalSupply
        totalSupply = totalSupply.sub(_value);                      
        Burn(msg.sender, _value);
        return true;
    }

    /**
     * Set allowance for other address
     *
     * Allows `_spender` to spend no more than `_value` tokens on your behalf
     *
     * @param _spender The address authorized to spend
     * @param _value the max amount they can spend
     */
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        return true;
    }

    /**
     * Set allowance for other address and notify
     *
     * Allows `_spender` to spend no more than `_value` tokens on your behalf, and then ping the contract about it
     *
     * @param _spender The address authorized to spend
     * @param _value the max amount they can spend
     * @param _extraData some extra information to send to the approved contract
     */
    function approveAndCall(address _spender, uint256 _value, bytes _extraData) public returns (bool success) {
        tokenRecipient spender = tokenRecipient(_spender);
        if (approve(_spender, _value)) {
            spender.receiveApproval(msg.sender, _value, this, _extraData);
            return true;
        }
    }


    /**
     * Destroy tokens from other account
     *
     * Remove `_value` tokens from the system irreversibly on behalf of `_from`.
     *
     * @param _from the address of the sender
     * @param _value the amount of money to burn
     */
    function burnFrom(address _from, uint256 _value) public ownerOnly returns (bool success) {
        // Check if the targeted balance is enough
        require(balanceOf[_from] >= _value);                

        // Check allowance        
        require(_value <= allowance[_from][msg.sender]);    

        // Subtract from the targeted balance
        balanceOf[_from] = balanceOf[_from].sub(_value);                         

        // Subtract from the sender's allowance
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);             

        // Update totalSupply
        totalSupply = totalSupply.sub(_value);                              
        Burn(_from, _value);
        return true;
    }

    /**
     * Transfer tokens from other address
     *
     * Send `_value` tokens to `_to` on behalf of `_from`
     *
     * @param _from The address of the sender
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        // Check allowance
        require(_value <= allowance[_from][msg.sender]);     
        
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);

        _transfer(_from, _to, _value);
        return true;
    }

    
    /**
     * Modifier checks that only the owner can access a certain function
     */
    modifier ownerOnly() {
        require(msg.sender == owner);
        _;
    }

}