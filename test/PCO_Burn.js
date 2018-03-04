const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const Compiler = require('../compile');
const moment = require('moment');

const provider = ganache.provider();
const web3 = new Web3(provider); 

const { interface, bytecode } = Compiler.compile('PCO.sol', 'PCO');
 

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
        .send({ from: accountOwner, gas: '4000000' });
    
    inbox.setProvider(provider);
});
 
describe('PCO - Burn', () => {

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