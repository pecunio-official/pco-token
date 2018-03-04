const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const Compiler = require('./compile');

const { interface, bytecode } = Compiler.compile('PCO.sol', 'PCO');

//get real
const provider = new HDWalletProvider(
    'denial night drum speed galaxy margin key music mind afraid mistake usual',
    'https://ropsten.infura.io/W9RHP4PK26arR4IngEe0 '
);

const web3 = new Web3(provider);


const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    console.log('Attempting to deploy from account', accounts[0]);

    const result = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({data: bytecode, arguments: []})
        .send({gas: 2000000, from:accounts[0]});
    
    console.log('Contract deployed to ', result.options.address);

}

deploy();