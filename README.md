# PCO Token

This is a [node.js] project containint the PCO token and a number of automated tests to confirm the functionality of the contract.


### Prerequisits

In Windows you need to install build tools:
```sh
$ npm install --global --production windows-build-tools 
```

### Installation

This project requires [Node.js](https://nodejs.org/) to run.
Install with
```sh
$ cd pco-token
$ npm install
```
To test the token (currently on local test network with [Ganache]). When you run the test, it is automatically deployed an run:

```sh
$ npm run test
```


## Authors
 Gerhard Liebmann <gerhard.liebmann@blocksunchained.com>

   [ganache]: <http://truffleframework.com/docs/ganache/using>
   [node.js]: <http://nodejs.org>
