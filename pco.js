
var program = require('commander');
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const Compiler = require('./compile');
const ganache = require('ganache-cli');
const prompt = require("prompt-async");

let provider; 
let web3;
let contract;

let compiledContract;
let pcoABI;
let pcoBytecode;
let tokenTimelockABI;



//main function (for async/await usage)
(async function() {

    program
        .version('0.1.0')
        .usage('')
        .option('-p, --production', 'Use production environment. Configurable in config.json')
        .option('-d, --deploy', 'Deploys the token to the selected network')
        //.option('-a, --access [contract address]', 'Access existing PCO contract at address')
        //.option('-s, --send [address]', 'Send funds to user')
        //.option('-l, --sendLocked [address]', 'Send funds locked')
        //.option('-r, --releaseLocked [address]', 'Release locked funds')
        //.option('-b, --balanceOf [address]')
        .parse(process.argv);

    // verify base data correct
    if (!program.deploy && !program.access) {
        console.log('Use either --deploy or --access to use this app. Exiting.');
        process.exit(-1);
    }

    await checkProductionAndSetProviders();

    await compileContract();
        
    if (program.deploy) {
        await deploy();
    }

    if (program.access) {
        await accessContract(program.access);
    }

    if (program.balanceOf) {
        let balance = await balanceOf(program.balanceOf);
        console.log ('balance of %s is %s', program.balanceOf, balance);
    }

    
})();


async function compileContract() {
    console.log('compiling contract...');

    //compile contract
    compiledContract = Compiler.compile('PCO.sol');
    
    //assigns ABIs and bytecode
    pcoABI = compiledContract['PCO:PCO'].interface;
    pcoBytecode = compiledContract['PCO:PCO'].bytecode;
    
    //timeLockABI
    tokenTimelockABI = compiledContract['zeppelin/token/ERC20/TokenTimelock.sol:TokenTimelock'].interface;
    
    console.log('contract compilation finished...');
}

async function checkProductionAndSetProviders() {
    //set provider (test/procduction - test is default)
    if (program.production) {
        console.log('WARNING: You are working in production mode. Are you Sure you want to proceed? (yes/no)')
        prompt.start();
    
        var schema = {
            properties: {
                Sure: {
                    pattern: /(^yes)|(^no)$/,
                    message: 'yes or no!',
                    required: true
                }
            }
        };
        
        // Get two properties from the user: username and email 
        let {Sure} = await prompt.get(schema);
        
        if (Sure === 'no') {
            console.log('Exiting...');
            process.exit(-1);
        }
        
        //set up provider
        provider = new HDWalletProvider(
            'denial night drum speed galaxy margin key music mind afraid mistake usual',
            'https://ropsten.infura.io/W9RHP4PK26arR4IngEe0 '
        );
        web3 = new Web3(provider);
    }
    else {
        provider = ganache.provider();
        web3 = new Web3(provider);
    }
}




/** 
 * Deploys the PCO contract and assigns global var "contract"
*/
async function deploy() {
    console.log('Starting depoyment...');

    const accounts = await web3.eth.getAccounts();
    console.log('Attempting to deploy from account', accounts[0]);

    contract = await new web3.eth.Contract(JSON.parse(pcoABI))
        .deploy({data: pcoBytecode, arguments: []})
        .send({gas: 2000000, from:accounts[0]});
    
    console.log('Contract deployed to ', contract.options.address);
}


async function accessContract(contractAddress) {
    console.log('Accessing contract...')
    contract = await new web3.eth.Contract(JSON.parse(pcoABI), contractAddress);
}
