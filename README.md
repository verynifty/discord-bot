# discord-bot
The VeryNifty Discord bot


nft20 events for deposit or retrieval from a pool is:
pairtoken -> transfer to 0x00 or from 0x00 (mining or burning)

example:
  const erc20Contract = new this.$store.state.web3.eth.Contract(
          NFT20Abi,
          this.address
        );
        this.loaded = true;
        let mints = await erc20Contract.getPastEvents('Transfer', ({fromBlock: 0, toBlock:"latest", filter: {from: "0x0000000000000000000000000000000000000000"}}));
        let burns = await erc20Contract.getPastEvents('Transfer', ({fromBlock: 0, toBlock:"latest", filter: {to: "0x0000000000000000000000000000000000000000"}}));
        let events = mints.concat(burns);
        events = events.sort(function(a, b){return a.blockNumber-b.blockNumber});
        
        
        
