import React from 'react';

import classNames from 'classnames';

import useLoginStore from 'shared/stores/LoginStore';
import useCorrectionsStore, {
  useCorrectionsStoreComputeds,
} from '../stores/CorrectionsStore';

import FieldSet from 'shared/components/FieldSet';
import TextInput from 'shared/components/TextInput';

import stylesheet from './CorrectAddress.less';

export default function CorrectAddress(): JSX.Element {
  const { correctedAddress, setCorrectedAddress } = useCorrectionsStore();
  const { previousAddress: defaultAddress } = useCorrectionsStoreComputeds();

  const { isLoginValidated } = useLoginStore();

  return (
    <FieldSet disabled={!isLoginValidated}>
      <FieldSet.Legend>Correct address</FieldSet.Legend>

      <p>Fix the address sometimes displayed with this photo.</p>

      <div>
        <TextInput
          type="text"
          name="address"
          aria-label="Address"
          className={classNames(stylesheet.addressInput)}
          placeholder={defaultAddress}
          value={correctedAddress}
          onChange={(event) => setCorrectedAddress(event.target.value || null)}
        />
      </div>
    </FieldSet>
  );
}
