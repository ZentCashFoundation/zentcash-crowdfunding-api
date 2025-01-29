const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const express = require('express');

const coinsList = 'https://raw.githubusercontent.com/ZentCashFoundation/zentcash-crowdfunding-list/refs/heads/main/zentcash-crowdfunding-list.json';

const addressBTC = 'bc1qxzh342p9alru57gz29jexxlc90rdqzvzlvr6lz';
const blockstreamApi = 'https://blockstream.info/api/address/'+ addressBTC;
const addressLTC = 'ltc1qyaalrjd6qkg9805774hfwtrccwuencz8xeetcz';
const litecoinspaceApi = 'https://litecoinspace.org/api/address/' + addressLTC;
const addressDOGE = 'D9M7Ef8G134iLeLP5cigvMNZ63gBZGAFJW';
const blockcypherdogeApi = 'https://api.blockcypher.com/v1/doge/main/addrs/' + addressDOGE;

async function fetchCoins() {
    try {
        const response = await  axios.get(coinsList);
        return response.data.coins;
    } catch (error) {
        console.error('Error fetching coins from GitHub');
        return [];
    }
}

async function fetchBlockstreamBTC() {
   try {
	const response = await axios.get(blockstreamApi);
	return response.data;
   } catch (error) {
       console.error('API Blockstream Down');
       return  [];
   }
}

async function fetchlitecoinspaceLTC() {
    try {
     const response = await axios.get(litecoinspaceApi);
     return response.data;
    } catch (error) {
        console.error('API Litecoinspace Down');
        return  [];
    }
}

async function fetchblockcypherDOGE() {
    try {
     const response = await axios.get(blockcypherdogeApi);
     return response.data;
    } catch (error) {
        console.error('API Blockcypher Down');
        return  [];
    }
 }

async function updateCrowdfundingList() {
    const coins = await fetchCoins();
    const updateCrowdfunding = [];

    for (const coin of coins) {
        console.log(chalk.bold.green(`Updating information for the currency: ${coin.name}`));

        if (coin.name === 'Bitcoin') {
            const blockstreamBTC = await fetchBlockstreamBTC();
            if (blockstreamBTC && blockstreamBTC.chain_stats) {
                const balance = blockstreamBTC.chain_stats.funded_txo_sum - blockstreamBTC.chain_stats.spent_txo_sum;
                console.log(chalk.bold.magenta(`${coin.name} Balance: ` + (balance / 10 ** coin.decimal).toFixed(8)));
                console.log(chalk.bold.blue(`${coin.name} Address: ${blockstreamBTC.address}`));
		updateCrowdfunding.push({
                    name: coin.name,
                    address: blockstreamBTC.address,
                    balance: (balance / 10 ** coin.decimal).toFixed(8),
                    image: coin.image
                });
            }
        } else if (coin.name === 'Litecoin') {
            const litecoinspaceLTC = await fetchlitecoinspaceLTC();
            if (litecoinspaceLTC && litecoinspaceLTC.chain_stats) {
                const balance = litecoinspaceLTC.chain_stats.funded_txo_sum - litecoinspaceLTC.chain_stats.spent_txo_sum;
		console.log(chalk.bold.magenta(`${coin.name} Balance: ` + (balance / 10 ** coin.decimal).toFixed(8)));
                console.log(chalk.bold.blue(`${coin.name} Address: ${litecoinspaceLTC.address}`));
                updateCrowdfunding.push({
                    name: coin.name,
                    address: litecoinspaceLTC.address,
                    balance: (balance / 10 ** coin.decimal).toFixed(8),
                    image: coin.image
                });
            }
        } else if (coin.name === 'Dogecoin') {
            const blockcypherDOGE = await fetchblockcypherDOGE();
            if (blockcypherDOGE) {
                const balance = blockcypherDOGE.total_received - blockcypherDOGE.total_sent;
		console.log(chalk.bold.magenta(`${coin.name} Balance: ` + (balance / 10 ** coin.decimal).toFixed(8)));
                console.log(chalk.bold.blue(`${coin.name} Address: ${blockcypherDOGE.address}`));
                updateCrowdfunding.push({
                    name: coin.name,
                    address: blockcypherDOGE.address,
                    balance: (balance / 10 ** coin.decimal).toFixed(8),
                    image: coin.image
                });
            }
        } else {
            console.log(chalk.red(`Error getting information for currency: ${coin.name}`));
        }
    }
    fs.writeFileSync('public/coins.json', JSON.stringify({ coins: updateCrowdfunding }, null, 2), 'utf8');
    console.log(chalk.green.bold('Crowdfunding list updated successfully.'));
}


console.log(chalk.bold.blue(`Started`));

fetchCoins().then(coins => {
    const jsonString = JSON.stringify(coins, null, 2);
    console.log(chalk.bold.red(`Currency List:`))
    console.log(chalk.green(jsonString));
});


updateCrowdfundingList()
setInterval(updateCrowdfundingList, 60 * 60 * 1000);

const app = express();

app.use(express.static('public'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'coins.json'));
});

app.get('/crowdfunding/balances/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'coins.json'));
});

const PORT = process.env.PORT || 12000;

app.listen(PORT, () => {
    console.log(chalk.blue.bold(`Server running on port ${PORT}`));
});

