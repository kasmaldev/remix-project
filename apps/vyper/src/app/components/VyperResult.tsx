import React, { useState } from 'react';
import {
  VyperCompilationResult,
  VyperCompilationOutput,
  isCompilationError,
  remixClient
} from '../utils';
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import { Ballot } from '../examples/ballot';
import Button from 'react-bootstrap/Button';
import JSONTree from 'react-json-view'
import { CopyToClipboard } from '@remix-ui/clipboard'


interface VyperResultProps {
  output?: VyperCompilationOutput;
}

function VyperResult({ output }: VyperResultProps) {
  const [ active, setActive ] = useState<keyof VyperCompilationResult>('abi');
  
  if (!output) return (
    <div id="result">
      <p>No contract compiled yet.</p>
      <Button variant="info" onClick={() => remixClient.loadContract(Ballot)}>
        Create Ballot.vy example
      </Button>
    </div>
  )

  if (isCompilationError(output)) {
    return (
    <div id="result" className="error">
      <i className="fas fa-exclamation-circle text-danger"></i>
      <p className="alert alert-danger">{output.message}</p>
    </div>)
  }

  return (
    <Tabs id="result" activeKey={active} onSelect={(key: any) => setActive(key)}>
      <Tab eventKey="abi" title="ABI">
        <CopyToClipboard getContent={() => JSON.stringify(output.abi)}>
          <Button variant="info" className="copy">Copy ABI</Button>
        </CopyToClipboard>
        <JSONTree src={output.abi} />
      </Tab>
      <Tab eventKey="bytecode" title="Bytecode">
        <CopyToClipboard getContent={() => output.bytecode}>
          <Button variant="info" className="copy">Copy Bytecode</Button>
        </CopyToClipboard>
        <textarea defaultValue={output.bytecode}></textarea>
      </Tab>
      <Tab eventKey="bytecode_runtime" title="Runtime Bytecode">
        <CopyToClipboard getContent={() => output.bytecode_runtime}>
          <Button variant="info" className="copy">Copy Runtime Bytecode</Button>
        </CopyToClipboard>
        <textarea defaultValue={output.bytecode_runtime}></textarea>
      </Tab>
      <Tab eventKey="ir" title="LLL">
        <CopyToClipboard getContent={() => output.ir}>
          <Button variant="info" className="copy">Copy LLL Code</Button>
        </CopyToClipboard>
        <textarea defaultValue={output.ir}></textarea>
      </Tab>
    </Tabs>
  );
}

export default VyperResult;