# airswap-tx
Will calculate an approximate volume on airswap dex contract.
```
Calculate transactions from block:  5579427
TOTAL Transactions:  238
TOTAL AST:  23975.121399999996
TOTAL ETH:  67.23254515669686
```
Requires etherscan API at the moment until switch over to web3js

## Running
* clone
* `npm install`
* Obtain an API key https://etherscan.io/apis
* add api key `const APIKEY = ''` to tx.js
* `npm run start`

## TODO
* add more pairs
* use web3 instead of etherscan
