# discord-bot
The VeryNifty Discord bot


nft20 events for deposit or retrieval from a pool is:
pairtoken -> transfer to 0x00 or from 0x00 (mining or burning)

You'll need to divide the amount by 100 as 100 tokens are transfereed at those events

example:

```
  const erc20Contract = web3.eth.Contract(
          NFT20Abi,
          contractAddress
        );
        let mints = await erc20Contract.getPastEvents('Transfer', ({fromBlock: 0, toBlock:"latest", filter: {from: "0x0000000000000000000000000000000000000000"}}));
        let burns = await erc20Contract.getPastEvents('Transfer', ({fromBlock: 0, toBlock:"latest", filter: {to: "0x0000000000000000000000000000000000000000"}}));
        let events = mints.concat(burns);
        events = events.sort(function(a, b){return a.blockNumber-b.blockNumber});
       
 ```
        
        

