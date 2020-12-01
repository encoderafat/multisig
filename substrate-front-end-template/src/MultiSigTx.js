import React, { useState } from 'react';
import { Form, Input, Grid, Label, Icon, Button } from 'semantic-ui-react';
import { useSubstrate } from './substrate-lib';
import { sortAddresses } from '@polkadot/util-crypto';

export default function Main (props) {
  const [status, setStatus] = useState(null);
  const [formState, setFormState] = useState({ addressTo: null, amount: 0 });
  const [mformState, setMFormState] = useState({ multiAddress: null, txHash: null, txData: null, threshold: 0, otherSignatories: '' });
  const [callHash, setCallHash] = useState(null);
  const [callData, setCallData] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const { accountPair } = props;
  const { api } = useSubstrate();
  const ss58Prefix = 42;

  const onChange = (_, data) =>
    setFormState(prev => ({ ...prev, [data.state]: data.value }));

  const { addressTo, amount } = formState;
  
  const onMChange = (_, data) =>
    setMFormState(prev => ({ ...prev, [data.state]: data.value }));
    
  const {multiAddress, txHash, txData, threshold, otherSignatories } = mformState;
  
  const approveAsMulti = async (signers) => {
	const tx = api.tx.multisig.approveAsMulti(threshold,signers,null,callHash,0);
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
  };

  const asMulti = async (signers,timepoint) => {
    const tx = api.tx.multisig.asMulti(threshold, signers,timepoint, callData, false, 1000000000);
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
  
  const createTX = () => {
	const txx = api.tx.balances.transfer(addressTo,amount);
	const txxHash = txx.method.hash.toHex();
	console.log(txxHash);
	setCallHash(txxHash);
    const txxData = txx.method.toHex();
    setCallData(txxData);
    setCreateSuccess(true);
  }
  
  const approveTX = async () => {
	console.log(otherSignatories);
	let signatories = otherSignatories.split(',');
	let otherSignatoriesSorted = sortAddresses(signatories,ss58Prefix);
	// Check for last approval
	console.log(txHash);
	console.log(callHash);
	console.log(multiAddress);
	
	const multisig = await api.query.multisig.multisigs(multiAddress,callHash);
	
	console.log(multisig.toHuman());
	
	const multisig2 = await api.query.multisig.multisigs(multiAddress,txHash);
	
	console.log(multisig2.toHuman());
	
	if (multisig.isSome) {
	  const timepoint = multisig.unwrap().when;
	  await asMulti(otherSignatoriesSorted,timepoint);
	} else {
	  await approveAsMulti(otherSignatoriesSorted);
	}
	
	
  }
  
  return (
    <Grid.Row>
      <Grid.Column width={8}>
        <h1>Create Multisig Transaction</h1>
        <Form>
          <Form.Field>
            <Label basic color='teal'>
              <Icon name='hand point right' />
              1 Unit = 1000000000000
            </Label>
          </Form.Field>
          <Form.Field>
            <Input
              fluid
              label='To'
              type='text'
              placeholder='recepient address'
              state='addressTo'
              onChange={onChange}
            />
          </Form.Field>
          <Form.Field>
            <Input
              fluid
              label='Amount'
              type='number'
              state='amount'
              onChange={onChange}
            />
          </Form.Field>
         
          <Form.Field style={{ textAlign: 'center' }}>
            <Button onClick={createTX}>Create</Button>
          </Form.Field>
          {createSuccess ?
			  <div>
			    <Form.Field style={{ overflowWrap: 'break-word' }}>
			      <Label>
			        Call Hash
			      </Label>
			      {callHash}
			    </Form.Field>
			    <Form.Field style={{ overflowWrap: 'break-word' }}>
			      <Label>
			        Call Data
			      </Label>
			      {callData}
			    </Form.Field>
			  </div>
			  : <div>
			    </div>
		  }
        </Form>
      </Grid.Column>
      <Grid.Column width={8}>
        <h1>Multisig UI Component</h1>
        <Form>
            <Form.Field>
            <Input
              fluid
              label='MultiSig'
              type='text'
              placeholder='MultiSig Address'
              state='multiAddress'
              onChange={onMChange}
            />
          </Form.Field>
          <Form.Field>
            <Input
              fluid
              label='Call Hash'
              type='text'
              placeholder='Call Hash'
              state='txHash'
              onChange={onMChange}
            />
          </Form.Field>
          <Form.Field>
            <Input
              fluid
              label='Call Data'
              type='text'
              placeholder='Call Data'
              state='txData'
              onChange={onMChange}
            />
          </Form.Field>
          <Form.Field>
            <Input
              fluid
              label='Threshold'
              type='number'
              state='threshold'
              onChange={onMChange}
            />
          </Form.Field>
          <Form.Field>
            <Input
              fluid
              label='Additional Signatories'
              type='text'
              placeholder='Address array (Separate by comma)'
              state='otherSignatories'
              onChange={onMChange}
            />
          </Form.Field>
          <Form.Field style={{ textAlign: 'center' }}>
            <Button onClick={async () => {await approveTX()}}>Create</Button>
          </Form.Field>
          <div style={{ overflowWrap: 'break-word' }}>{status}</div>
        </Form>
      </Grid.Column>
    </Grid.Row>

  );
}
