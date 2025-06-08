const fs = require('fs');
const moment = require('moment');
const colors = require('colors');
const ethers = require('ethers'); 
const { Wallet, JsonRpcProvider } = require('ethers');
const { NETWORKS } = require('../src/utils/config');
const { SPIN_ABI } = require('../src/ABI/abiSpin');

// Setup provider using network config
const network = NETWORKS.plume;
const provider = new JsonRpcProvider(network.rpcUrl);

const CONTRACT = SPIN_ABI.at(-1).CA;


async function DailySpin(wallet) {
    try {
        const dataValue = '0xac6bc853';
        const spinPrice = ethers.parseUnits("2", "ether");
        // const spinPrice = '0x1bc16d674ec80000';
        
        console.log(`\n[${moment().format('HH:mm:ss')}] Processing wallet: ${wallet.address}`.cyan);
        console.log(`Network: ${network.name} (${network.symbol})`.cyan);
        
        // Get fee data
        console.log('Getting fee data...'.cyan);
        const feeData = await wallet.provider.getFeeData();
        
        // Get nonce
        console.log('Getting nonce...'.cyan);
        const nonce = await provider.getTransactionCount(wallet.address);
        
        const gasFee = feeData.gasPrice;
        console.log(`Gas Price: ${gasFee.toString()} Wei`.cyan);

        // Estimate gas
        console.log('Estimating gas...'.cyan);
        const gasLimit = await wallet.estimateGas({
            data: dataValue,
            to: CONTRACT,
            value: spinPrice
        });
        console.log(`Gas Limit: ${gasLimit.toString()}`.cyan);

        const tx = {
            to: CONTRACT,
            from: wallet.address,
            nonce,
            data: dataValue,
            gas: gasLimit,
            gasPrice: gasFee,
            value: spinPrice,
            chainId: network.chainId 
        };

        console.log('Sending transaction...'.yellow);
        const result = await wallet.sendTransaction(tx);
        
        console.log(`Transaction sent! Hash: ${result.hash}`.green);
        console.log(
            `[${moment().format('HH:mm:ss')}] Daily spin for ${
                wallet.address
            } successful!`.green
        );
        console.log(
            `Check transaction: ${network.explorer}tx/${result.hash}`.cyan
        );
        
        // Wait for transaction confirmation
        console.log('Waiting for transaction confirmation...'.yellow);
        await result.wait(1);
        console.log('Transaction confirmed!'.green);

    } catch (error) {
        console.error(`Error in DailySpin for ${wallet.address}:`.red);
        console.error(error.message.red);
        throw error;
    }
}

async function dailySpin() {
    console.log('\nStarting daily spin process...'.yellow);
    console.log(`Processing ${PRIVATE_KEYS.length} wallets`.cyan);

    for (let i = 0; i < PRIVATE_KEYS.length; i++) {
        const privateKey = PRIVATE_KEYS[i];
        console.log(`\nProcessing wallet ${i + 1}/${PRIVATE_KEYS.length}`.cyan);
        
        try {
            const wallet = new Wallet(privateKey, provider);
            console.log(`Wallet address: ${wallet.address}`.cyan);
            await DailySpin(wallet);
        } catch (error) {
            console.error(`Failed processing wallet ${i + 1}:`.red);
            console.error(error.message.red);
            // Continue with next wallet instead of stopping
        }
    }
}

// Execute main function
console.log('\nInitiating daily spin process...'.yellow);
dailySpin()
    .then(() => {
        console.log('\nDaily spin process completed successfully!'.green);
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nFatal error in daily spin process:'.red);
        console.error(error.message.red);
        process.exit(1);
    });
