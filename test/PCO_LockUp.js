const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const Compiler = require('../compile');
const moment = require('moment');
const sleep = require('await-sleep');
const CircularJSON = require('circular-json')

const provider = ganache.provider();
const web3 = new Web3(provider); 

const compiledContract = Compiler.compile('PCO.sol');
const { interface, bytecode } = compiledContract['PCO:PCO'];
const tokenTimelockABI = compiledContract['zeppelin/token/ERC20/TokenTimelock.sol:TokenTimelock'].interface;

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

    it('send 100 coins locked for 2 days and try to release prematurely', async () => {
        let amountLocked = 1000;
        let amountUnlocked = 100;

        //calculate unix timestamp of in 2 days
        var in2days = moment().add(2, 'days').format('X');
        
        //send unlocked coins to user1
        await inbox.methods.transfer(accountUser1, amountUnlocked)
            .send({ from: accountOwner, gas: '6000000' });

        //send locked coins to user1 with 2 day lock
        let timeLockAddress = await inbox.methods.transferWithTimeLock(accountUser1, amountLocked, in2days)
            .send({ from: accountOwner, gas: '6000000' });

        //check if unlocked blance is correct
        let balanceUser1Unlocked = await inbox.methods.balanceOf(accountUser1).call();
        assert.equal(parseInt(balanceUser1Unlocked), amountUnlocked);

        //check if locked blance is correct
        let balanceUser1Locked = await inbox.methods.balanceOf(timeLockAddress.events.Transfer.returnValues.to).call();
        assert.equal(parseInt(balanceUser1Locked), amountLocked);

        //access TokenTimelock contract
        let timeLockContractUser1 = await new web3.eth.Contract(
            JSON.parse(tokenTimelockABI), 
            timeLockAddress.events.Transfer.returnValues.to);        
        
        //make sure beneficiary is correct
        let beneficiary =  await timeLockContractUser1.methods.beneficiary().call();
        assert.equal(beneficiary, accountUser1)

        //try to prematurely release - should fail
        await assertThrowsAsync(async () => await timeLockContractUser1.methods.release().call()
            , /Error/);
    });


    it('send 100 coins locked for 1 day and release when releasable', async () => {
        let amountLocked = 1000;

        //calculate unix timestamp of in 2 days
        var in1day = moment().add(1, 'day').format('X');

        //send locked coins to user1 with 2 day lock
        let timeLockAddress = await inbox.methods.transferWithTimeLock(accountUser1, amountLocked, in1day)
            .send({ from: accountOwner, gas: '6000000' });

        //check if locked blance is correct
        let balanceUser1Locked = await inbox.methods.balanceOf(timeLockAddress.events.Transfer.returnValues.to).call();
        assert.equal(parseInt(balanceUser1Locked), amountLocked);

        //access TokenTimelock contract
        let timeLockContractUser1 = await new web3.eth.Contract(
            JSON.parse(tokenTimelockABI), 
            timeLockAddress.events.Transfer.returnValues.to);        
        
        //make sure beneficiary is correct
        let beneficiary =  await timeLockContractUser1.methods.beneficiary().call();
        assert.equal(beneficiary, accountUser1)

        //release
        await timeLockContractUser1.methods.release().call();

        //make sure, we are past the release time
        await sleep(200);

        //check if tokens are released correctly and an the beneficiaries account
        let balanceUser1Unlocked = await inbox.methods.balanceOf(accountUser1).call();
        assert.equal(parseInt(balanceUser1Unlocked), amountLocked);
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