import React, { useState } from 'react';
import { Button, Form, Input, Grid, Label, Icon } from 'semantic-ui-react';
import { useSubstrate } from './substrate-lib';
const { createKeyMulti, encodeAddress, sortAddresses } = require('@polkadot/util-crypto');

export default function Main (props) {
  const [status,setStatus] = useState(null);
  const [formState, setFormState] = useState({ threshold: 0, signatories: ''});
  const [amount, setAmount] = useState(0);
  const [multisigAddress, setMultisigAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [accSuccess, setAccSuccess] = useState(false);
  const { accountPair } = props;

  const onChange = (_, data) =>
    setFormState(prev => ({ ...prev, [data.state]: data.value }));
    
  const onTransfer = (e) => {
	  let amt = e.target.value;
	  setAmount(amt);
  }

  const { threshold, signatories } = formState;

  const { api } = useSubstrate();
  
  const ss58Prefix = 42;
  
  const createMultiAddress = () => {
	let sign = signatories.split(/,| /);
	setAddresses(sign);
	const address1 = createKeyMulti(addresses,threshold);
	const multiAddress = encodeAddress(address1,ss58Prefix);
	setMultisigAddress(multiAddress);
	setAccSuccess(true);
  } 
  
  const fundMultiAddressAccount = async () => {
	console.log(amount);
	const tx = api.tx.balances.transfer(multisigAddress,amount);
	return new Promise((resolve,reject) => {
		tx.signAndSend(accountPair, (result) => {
			if (result.status.isInBlock) {
				setStatus(`Current transaction status: ${result.status.type}`);
			 } else if (result.status.isFinalized) {
				 resolve(result);
				setStatus(`😉 Finalized. Block hash: ${result.status.asFinalized.toString()}`);
			 } else if (result.status.isDropped || result.status.isInvalid || result.status.isUsurped) {
				 reject(result);
				 setStatus(`Transaction Rejected`);
			 };
		});
	});
	
}
  
  
  const transfer = async () => {
    createMultiAddress();
  };
  
  

  return (
      <Grid.Column width={8}>
        <h1>Create Multisig Address</h1>
        <Form>
          <Form.Field>
          <Input
            fluid
            label='Threshold'
            type='number'
            state='threshold'
            onChange={onChange}
          />
        </Form.Field>
        <Form.Field>
          <Input
            fluid
            label='Signatories'
            type='text'
            placeholder='Signatories Addresses array (Separate by comma or space)'
            state='signatories'
            onChange={onChange}
          />
        </Form.Field>
          <Form.Field style={{ textAlign: 'center' }}>
            <Button onClick={transfer}>Create Multisig</Button>
          </Form.Field>
        </Form>
        {accSuccess ? 
			<Form>
			  <Form.Field>
			    <h1>Transfer</h1>
			  </Form.Field>
			  <Form.Field>
                <Label basic color='teal'>
                  <Icon name='hand point right' />
                  1 Unit = 1000000000000
                </Label>
              </Form.Field>
			  <Form.Field>
				<Label>
				  MultiSig
				</Label>
				{multisigAddress}
			  </Form.Field>
		      <Form.Field>
				<Input
				  fluid
				  label='Amount'
				  type='number'
				  placeholder='Amount to Transfer to Multisig'
				  state='amount'
				  onChange={onTransfer}
				/>
		      </Form.Field>
		      <Form.Field style={{ textAlign: 'center' }}>
		        <Button onClick={async () => {await fundMultiAddressAccount()}}>Transfer</Button>
		      </Form.Field >
		      <div style={{ overflowWrap: 'break-word' }}>{status}</div>
			</Form>
			:
			<div>
			</div>
		}
      </Grid.Column>
  );
}
