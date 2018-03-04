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
        .send({ from: accountOwner, gas: '6000000' });
    
    inbox.setProvider(provider);
});
 
describe('PCO Token - LockUp', () => {

    it('send 100 coins locked for 2 days ....', async () => {
        let amountLocked = 1000;

        var in2days = moment().add(2, 'days').format('X');
        console.log('in2days: ' + in2days);

        await inbox.methods.transferWithTimeLock(accountUser1, amountLocked, in2days).send({ from: accountOwner });
        //let lockedBalance = await inbox.methods.lockedBalanceOf(accountUser1).call();
        //let balance = await inbox.methods.balanceOf(accountUser1).call();

        //assert.equal(balance, lockedBalance);
        
        
        //let lockedBalance = await inbox.methods.lockedBalanceOf(accountOwner).call();
        //console.log(lockedBalance);*/
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