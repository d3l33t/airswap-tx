const ethScan = require('etherscan-api').init('XHSKYS8FKN6U9FGRHMUJM7WB3E811TXZAY')
const abiDecoder = require('abi-decoder')
const http = require('http')
const WETHcontract = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const ASTcontract = '0x27054b13b1b798b345b591a4d22e6562d47ea75a'
const DEXcontract = '0x8fd3121013a07c57f0d69646e86e7a4880b467b7'
var totalAST = 0
var totalWETH = 0
const averageBlockPerHour = 245

http.get('http://api.etherscan.io/api?module=proxy&action=eth_blockNumber', (res) => {
  res.setEncoding('utf8')
  let rawData = ''
  res.on('data', (chunk) => { rawData += chunk })
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(rawData)
      if (parsedData.result) {
          const currentBlock = parseInt(parsedData.result, 16)
          const blockNo = currentBlock - (averageBlockPerHour * 24)
          console.log('Calculate transactions from block: ', blockNo)
          calculateVolume(blockNo)
      }
    } catch (e) {
      console.error(e.message)
    }
  })
})

function calculateVolume(blockNo) {
  ethScan.contract.getabi(DEXcontract).then((resInit) => {
    if (resInit.status) {
      try {
        const abi = JSON.parse(resInit.result)
        abiDecoder.addABI(abi)
      } catch (e) {
        console.log(e)
      }
      ethScan.account.txlist(DEXcontract, blockNo, 'latest', 'asc').then((txRes) => {
        const txList = txRes.result
        const mapped = txList
          .filter((tx) => {
            return tx.isError !== '1'
          })
          .map(mapTransactions)
          .map(mapDecimal)
          .map(mapRate)

        // grab newest transactions 100
        console.log('TOTAL Transactions: ', mapped.length)
        console.log('TOTAL AST: ', totalAST)
        console.log('TOTAL ETH: ', totalWETH)
      })
    }
  })
}

function mapTransactions (tx) {
  const decoded = abiDecoder.decodeMethod(tx.input)
  tx.date = new Date(tx.timeStamp * 1000)
  if (decoded) {
    decoded.params.forEach((item, i, a) => {
      tx[item.name] = item.value
      if (item.name === 'makerToken' && item.value === WETHcontract) {
        tx.makerSymbol = 'WETH'
      }
      if (item.name === 'takerToken' && item.value === WETHcontract) {
        tx.takerSymbol = 'WETH'
      }
      if (item.name === 'makerToken' && item.value === ASTcontract) {
        tx.makerSymbol = 'AST'
      }
      if (item.name === 'takerToken' && item.value === ASTcontract) {
        tx.takerSymbol = 'AST'
      }
    })
  }
  return tx
}

function mapDecimal (tx) {
  if (tx.makerSymbol === 'WETH') {
    tx.makerAmountRate = tx.makerAmount / 1000000000000000000
    totalWETH += tx.makerAmountRate
  }
  if (tx.takerSymbol === 'WETH') {
    tx.takerAmountRate = tx.takerAmount / 1000000000000000000
    totalWETH += tx.takerAmountRate
  }
  if (tx.makerSymbol === 'AST') {
    tx.makerAmountRate = tx.makerAmount / 10000
    totalAST += tx.makerAmountRate
  }
  if (tx.takerSymbol === 'AST') {
    tx.takerAmountRate = tx.takerAmount / 10000
    totalAST += tx.takerAmountRate
  }
  return tx
}

function mapRate (tx) {
  if (tx.makerSymbol === 'WETH') {
    tx.rate = tx.makerAmountRate / tx.takerAmountRate
  } else {
    tx.rate = tx.takerAmountRate / tx.makerAmountRate
  }
  tx.rate = tx.rate
  return tx
}
