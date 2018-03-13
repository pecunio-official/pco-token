const path = require('path');
const fs = require ('fs');
const solc = require('solc');

const CONTRACTS_DIR = path.resolve(__dirname, 'contracts');

function findContract(pathName) {
    const contractPath = path.resolve(__dirname,'contracts', pathName);
    if (fs.existsSync(contractPath)) {
        return fs.readFileSync(contractPath, 'utf8');
    } else {
        throw new Error(`File ${contractPath} not found`);
    }
}

function findImports (pathName) {
    try {
        return { contents: findContract(pathName) };
    } catch(e) {
        return { error: e.message };
    }
}



function compile(filename, contractName) {
/*    const inboxPath = path.resolve(__dirname, 'contracts', filename);
    const source = fs.readFileSync(inboxPath, 'utf8');
    let res = solc.compile(source, 1);
    //.contracts[':' + contractName];
    return res;*/
   
    const source = findContract(filename);
    let res = solc.compile({
            sources: { 'PCO': source }
        }, 1, findImports)

    if (contractName===undefined)
        return res.contracts;
        
    return res.contracts[contractName + ':' + contractName];
}


module.exports = {
    compile: compile
}