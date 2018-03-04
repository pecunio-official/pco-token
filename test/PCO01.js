const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const Compiler = require('../compile');
 
const provider = ganache.provider();
const web3 = new Web3(provider); 

const { interface, bytecode } = Compiler.compile('PCO01.sol', 'PCO01');
//const { interface, bytecode } = Compiler.compile('SimpleToken.sol', 'SimpleToken');
 

let accounts,
    inbox;

let accountOwner, 
    accountUser1,
    accountUser2;

const expTotalSupply = 10000000000000000;
 
beforeEach(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();
    accountOwner = accounts[0];
    accountUser1 = accounts[1];
    accountUser2 = accounts[2];
    
    // Use one of those accounts to deploy the contract
    inbox = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode, arguments: [] })
        .send({ from: accountOwner, gas: '1000000' });
    
    inbox.setProvider(provider);
});
 
describe('PCO01 - ERC20 functions', () => {

    it('deploys a contract', () => {
        assert.ok(inbox.options.address);
    });

    it('has a default supply of 10^16 separate units', async () => {
        const message = await inbox.methods.totalSupply().call();
        const expTotalSupply = 10000000000000000;
        assert.equal(parseInt(message), expTotalSupply);
    });
    
    it('has a default decimals of 8', async () => {
        const message = await inbox.methods.DECIMALS().call();
        assert.equal(message, 8);
    });

    it('has the correct name', async () => {
        const name = await inbox.methods.name().call();
        assert.equal(name, "PCO Test 01");
    });

    it('has the correct symbol', async () => {
        const symbol = await inbox.methods.symbol().call();
        assert.equal(symbol, "PCO01");
    });

    it('contract owner owns all tokens', async () => {
        const balance = await inbox.methods.balanceOf(accountOwner).call();
        assert.equal(parseInt(balance), expTotalSupply);
    });

    it('send 10 tokens to user1 from contract owner', async () => {
        let sendAmount = 10;
        await inbox.methods.transfer(accountUser1, sendAmount).send({ from: accountOwner });
        const balanceUser1 = await inbox.methods.balanceOf(accountUser1).call();
        const balanceOwner = await inbox.methods.balanceOf(accountOwner).call();
        
        assert.equal(parseInt(balanceUser1), sendAmount);
        assert.equal(parseInt(balanceOwner), expTotalSupply-sendAmount);
    });

    it('should fail: overspend, user1 tries to send 12 tokens to user2', async () => {
        let sendAmount = 12;        
        await assertThrowsAsync(async () => await inbox.methods.transfer(accountUser2, sendAmount).send({ from: accountUser1 })
            , /Error/);
    });

    it('should fail: spend negative amount', async () => {
        let sendAmount = -2;        
        await assertThrowsAsync(async () => await inbox.methods.transfer(accountUser2, sendAmount).send({ from: accountUser1 })
            , /Error/);
    });

});


describe('PCO01 - Burn', () => {

    it('burn 1000 tokens', async () => {
        let balanceBefore = await inbox.methods.balanceOf(accountOwner).call();
        
        let amount = 1000;
        await inbox.methods.burn(amount).send({ from: accountOwner });

        let balanceAfter = await inbox.methods.balanceOf(accountOwner).call();
        
        //check if right amount was burned
        assert.equal(parseInt(balanceBefore), parseInt(balanceAfter)+amount);
    });

    it('should fail: user1 burns 1000 tokens (not allowed)', async () => {
        let amount = '1000';
        await assertThrowsAsync(async () => await inbox.methods.burn(amount).send({ from: accountUser1 })
        , /Error/);
    });


    it('should fail: burn more than available', async () => {
        //amount is string, as int can't hold that number (and arguments are sent as string anyway)
        let amount = '10000000000000001';
        
        await assertThrowsAsync(async () => await inbox.methods.burn(amount).send({ from: accountOwner })
            , /Error/);

        let balanceBefore = await inbox.methods.balanceOf(accountOwner).call();

    });
});


describe('PCO01 - LockUp', () => {

    it('lock up ....', async () => {
        //todo
    });
});


/**
 * Helper function for async exceptions
 * @param {function} fn 
 * @param {*} regExp 
 */
async function assertThrowsAsync(fn, regExp) {
    let f = () => {};
    try {
      await fn();
    } catch(e) {
      f = () => {throw e};
      //console.log(e);
    } finally {
      assert.throws(f, regExp);
    }
  }