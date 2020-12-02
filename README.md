# Challenge 5 : Frame Multisig

1. Add the Multisig Pallet to the Node Template

https://github.com/encoderafat/multisig/tree/main/substrate-node-template

2. Add a script to make a multisig transaction.

Script added here -> https://github.com/encoderafat/multisig/tree/main/scripts

The script creates a threshold = 2 and signatories = 3 multisig account, funds the account with 100 units , creates a multisig transaction of amount 20 to a
fourth account,uses the first signatory to approve (approve_as_multi) and the second signatory to complete the transaction. 

<img src="https://github.com/encoderafat/multisig/blob/main/img/script.jpg" />

3. Use the Front-End Template to create a multisig UI component.

https://github.com/encoderafat/multisig/tree/main/substrate-front-end-template

I've created a component that creates a multisig account , given a threshold and a list of signatories, and transfers some funds to that account.

<img src="https://github.com/encoderafat/multisig/blob/main/img/multisig.png" />

<img src="https://github.com/encoderafat/multisig/blob/main/img/multisig_block_explorer.png" />


