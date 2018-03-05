const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const Compiler = require('../compile');
const moment = require('moment');
const sleep = require('await-sleep');


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

    it('send 100 coins locked for 2 days and try to spend prematurely', async () => {
        let amountLocked = 1000;
        let amountUnlocked = 100;

        //calculate unix timestamp of in 2 days
        var in2days = moment().add(2, 'days').format('X');
        
        //send unlocked coins to user1
        await inbox.methods.transfer(accountUser1, amountUnlocked)
            .send({ from: accountOwner, gas: '6000000' });

        //send locked coins to user1 with 2 day lock
        await inbox.methods.transferWithTimeLock(accountUser1, amountLocked, in2days)
            .send({ from: accountOwner, gas: '6000000' });

        let {lockedBalance, balance} = await getAllBalances(accountUser1);
        
        //check if locked amount is equal to sent amount
        assert.equal(balance - amountUnlocked, lockedBalance.sum);

        //try to send unlockedAmount+1 to user2 (should fail)
        await assertThrowsAsync(async () => await inbox.methods.transfer(accountUser2, amountUnlocked+1)
            .send({ from: accountUser1, gas: '6000000' })
            , /Error/);

        //try to send unlocked amount to user2 (should work)
        await inbox.methods.transfer(accountUser2, amountUnlocked)
            .send({ from: accountUser1, gas: '6000000' })

        let balanceUser2 = await inbox.methods.balanceOf(accountUser2).call();
        await sleep(300);

        assert.equal(parseInt(balanceUser2), parseInt(amountUnlocked));
    });

    /*it('test if coins unlocked after lock up over', async () => {
        let amountLocked = 1000;
        
        //calculate unix timestamp of in 2 days
        var in2days = moment().add(1, 'seconds').format('X');
        
        //send locked coins to user1 with 2 day lock
        await inbox.methods.transferWithTimeLock(accountUser1, amountLocked, in2days)
            .send({ from: accountOwner, gas: '6000000' });

        let {lockedBalance, balance} = await getAllBalances(accountUser1);

        //check if locked amount is equal to sent amount
        assert.equal(amountLocked, lockedBalance.sum);
        assert.equal(amountLocked, balance);

        //try to send the locked amount to user2 (should fail)
        await assertThrowsAsync(async () => await inbox.methods.transfer(accountUser2, amountLocked)
            .send({ from: accountUser1, gas: '6000000' })
            , /Error/);

        await sleep(1200);

        //try to send unlocked amount to user2 (should work)
        await inbox.methods.transfer(accountUser2, amountLocked)
            .send({ from: accountUser1, gas: '6000000' })

        let balanceUser1 = await inbox.methods.balanceOf(accountUser1).call();
        let balanceUser2 = await inbox.methods.balanceOf(accountUser2).call();

        //check if user 2 received the tokens
        assert.equal(parseInt(balanceUser2), parseInt(amountLocked));
        

        let {lockedBalanceU1, balanceU1} = await getAllBalances(accountUser1);
console.log(JSON.stringify(lockedBalanceU1));

        //check that locked balance is 0
        assert.equal(parseInt(lockedBalanceU1.sum), 0);

        //check that total  balance is 0
        assert.equal(parseInt(balanceU1), 0);
        
    });*/

});


/**
 * Helper function to get locked and total balance
 * @param {address} user 
 */
async function getAllBalances(user) {
    //get locked balance
    let lockedBalance = await inbox.methods.lockedBalanceOf(user).call();

    //get total balance (includes locked balance)
    let balance = await inbox.methods.balanceOf(user).call();

    return { lockedBalance:lockedBalance, balance:balance};
}  

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