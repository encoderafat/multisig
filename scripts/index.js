const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');
const { createKeyMulti, encodeAddress, sortAddresses } = require('@polkadot/util-crypto');
const chalk = require('chalk');
const UNIT = BigInt(1000000000000);// 1 unit = 1e12

const ss58Prefix = 42;

const getBalance = async (api,address) => {
	const balance = (await api.query.system.account(address)).data;
	return balance;
}

const createMultiAddress = (addresses,threshold) => {
	const address1 = createKeyMulti(addresses,threshold);
	const multiAddress = encodeAddress(address1,ss58Prefix);
	console.log(chalk.green("Generated MultiSig Address : "),chalk.white(multiAddress));
	return multiAddress;
} 

const fundMultiAddressAccount = async (api,signer,multisigAddress,amount) => {
	const tx = api.tx.balances.transfer(multisigAddress,BigInt(amount)*UNIT);
	return new Promise((resolve,reject) => {
		tx.signAndSend(signer, (result) => {
			if (result.status.isInBlock) {
				console.log(chalk.white("Current transaction status: "),chalk.green(`${result.status.type}`));
			 } else if (result.status.isFinalized) {
				 resolve(result);
				console.log(chalk.white("Finalized. Block hash: "),chalk.green(`${result.status.asFinalized.toString()}`));
			 } else if (result.status.isDropped || result.status.isInvalid || result.status.isUsurped) {
				 reject(result);
			 };
		});
	});
	const newBalance = await getBalance(api,multisigAddress);
	const normBalance = BigInt(parseInt(newBalance.free))/UNIT;
	console.log(chalk.green("MultiSig Address : "),chalk.white(multisigAddress),chalk.green("  Balance: "),chalk.white(normalBalance));
}

const approveAsMulti = async (api,approver,otherSignatories,threshold,txHash) => {
  const tx = api.tx.multisig.approveAsMulti(threshold,otherSignatories,null,txHash,0);
  return new Promise((resolve,reject) => {
		tx.signAndSend(approver, (result) => {
			if (result.status.isInBlock) {
				console.log(chalk.white("Current transaction status: "),chalk.green(`${result.status.type}`));
			 } else if (result.status.isFinalized) {
				 resolve(result);
				console.log(chalk.white("Finalized. Block hash: "),chalk.green(`${result.status.asFinalized.toString()}`));
			 } else if (result.status.isDropped || result.status.isInvalid || result.status.isUsurped) {
				 reject(result);
			 };
		});
	});
}

const asMulti = async (api,approver,otherSignatories,threshold,timepoint,txData) => {
  const tx = api.tx.multisig.asMulti(threshold,otherSignatories,timepoint,txData,false,1000000000);
  return new Promise((resolve,reject) => {
		tx.signAndSend(approver, (result) => {
			if (result.status.isInBlock) {
				console.log(chalk.white("Current transaction status: "),chalk.green(`${result.status.type}`));
			 } else if (result.status.isFinalized) {
				 resolve(result);
				console.log(chalk.white("Finalized. Block hash: "),chalk.green(`${result.status.asFinalized.toString()}`));
			 } else if (result.status.isDropped || result.status.isInvalid || result.status.isUsurped) {
				 reject(result);
			 };
		});
	});
}

const Main = async () => {
  const provider = new WsProvider('ws://127.0.0.1:9944');
  const api = await ApiPromise.create({ provider });
  const keyring = new Keyring({ type: 'sr25519' });

  const alice = keyring.addFromUri('//Alice');
  const bob = keyring.addFromUri('//Bob');
  const charlie = keyring.addFromUri('//Charlie');
  const ferdie = keyring.addFromUri('//Ferdie');
  
  const addresses =  [alice.address,bob.address,charlie.address];
  const threshold = 2;
  
  // Create Multisig Address
  
  console.log(chalk.red("========Create Multisig Address (3 Signatories) with Threshold of 2========"));
  
  const multiAddress = createMultiAddress(addresses,threshold);
  
  // Use the Alice Account to fund Multisig Address (100 units)
  
  console.log(chalk.red("========Transfer 100 Unit to Multisig Address========"));
  
  const initAmount = 100;
  
  await fundMultiAddressAccount(api,alice,multiAddress,initAmount);
  
  // Amount to be transferred from Multisig to Ferdie
  
  console.log(chalk.red("========Create Transaction (20 Units) From Multisig to Ferdie========"));
  
  const txAmount = 20;
  
  const txFerdie = api.tx.balances.transfer(ferdie.address,BigInt(txAmount)*UNIT);
  
  const txHash = txFerdie.method.hash;
  const txData = txFerdie.method.toHex();
  console.log(chalk.green("Transaction Hash: "),chalk.white(txHash));
  console.log(chalk.green("Transaction Data: "),chalk.white(txData));
  
  // Get Approval From account 1 (Alice)
  
  console.log(chalk.red("========Get Approval From account 1 [Alice]========"));
  
  const approver = alice;
  let otherSignatories = [bob.address,charlie.address];
  let otherSignatoriesSorted = sortAddresses(otherSignatories,ss58Prefix);
  
  await approveAsMulti(api,approver,otherSignatoriesSorted,threshold,txHash);
  
  
  // Get Second & Final Approval From account 2 (Bob)
  
  console.log(chalk.red("========Get Approval From account 2 [Bob]========"));
  
  const approver2 = bob;
  otherSignatories = [alice.address,charlie.address];
  otherSignatoriesSorted = sortAddresses(otherSignatories,ss58Prefix);
  
  const multisig = await api.query.multisig.multisigs(multiAddress,txHash);
  const timepoint = multisig.unwrap().when;
  
  await asMulti(api,approver2,otherSignatoriesSorted,threshold,timepoint,txData);
  
  // Get Balances of Multisig and Ferdie account
  
  console.log(chalk.red("========MultiSig Transaction Completed========"));
  
  const newBalance = await getBalance(api,multiAddress);
  let normBalance = BigInt(parseInt(newBalance.free))/UNIT;
  console.log(chalk.green("MultiSig Address : "),chalk.white(multiAddress),chalk.green("  Balance: "),chalk.white(normBalance));
  
  const ferdieBalance = await getBalance(api,ferdie.address);
  normBalance = BigInt(parseInt(ferdieBalance.free))/UNIT;
  console.log(chalk.green("Ferdie Address : "),chalk.white(ferdie.address),chalk.green("  Balance: "),chalk.white(normBalance));
  
}


Main().catch(err => {
    const log = chalk.red(err) // we set the color red here for errors.
    console.log(log)
}).finally(() => process.exit());
