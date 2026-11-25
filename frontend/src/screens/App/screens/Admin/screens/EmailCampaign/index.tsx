import React, { useState } from 'react';
import Button from 'shared/components/Button';
import Checkbox from 'shared/components/Checkbox';
import Modal from 'shared/components/Modal';
import TextInput from 'shared/components/TextInput';
import stylesheet from './EmailCampaign.less';
import useEmailCampaignStore from './stores/EmailCampaignStore';

export default function EmailCampaign(): React.JSX.Element {
  const template = useEmailCampaignStore((state) => state.template);
  const livemode = useEmailCampaignStore((state) => state.livemode);
  const sendOn = useEmailCampaignStore((state) => state.sendOn);
  const isLoading = useEmailCampaignStore((state) => state.isLoading);
  const isSent = useEmailCampaignStore((state) => state.isSent);
  const error = useEmailCampaignStore((state) => state.error);
  const setTemplate = useEmailCampaignStore((state) => state.setTemplate);
  const setLivemode = useEmailCampaignStore((state) => state.setLivemode);
  const setSendOn = useEmailCampaignStore((state) => state.setSendOn);
  const send = useEmailCampaignStore((state) => state.send);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLiveConfirmed, setIsLiveConfirmed] = useState(false);

  const closeConfirmation = (): void => {
    setIsConfirming(false);
    setIsLiveConfirmed(false);
  };

  return (
    <div className={stylesheet.container}>
      <h1>Send an Email Campaign</h1>
      <TextInput
        placeholder="Template name"
        size={40}
        value={template}
        onChange={(e) => setTemplate(e.target.value.trim())}
      />
      <label className={stylesheet.checkboxLabel}>
        <Checkbox
          checked={livemode}
          onChange={(e) => setLivemode(e.target.checked)}
        />
        Live mode
      </label>
      <TextInput
        type="datetime-local"
        value={sendOn}
        onChange={(e) => setSendOn(e.target.value)}
      />
      <Button
        buttonStyle="primary"
        onClick={() => setIsConfirming(true)}
        disabled={!template || !sendOn}
      >
        Send
      </Button>
      <Modal
        isOpen={isConfirming}
        onRequestClose={closeConfirmation}
        size="small"
      >
        <div className={stylesheet.confirmation}>
          <div>
            Send template “{template}” on {new Date(sendOn).toLocaleString()}
            {livemode ? ' to the whole mailing list' : ' in test mode'}?
          </div>
          {livemode && (
            <label className={stylesheet.checkboxLabel}>
              <Checkbox
                checked={isLiveConfirmed}
                onChange={(e) => setIsLiveConfirmed(e.target.checked)}
                disabled={isLoading}
              />
              I understand this emails real subscribers
            </label>
          )}
          <div className={stylesheet.buttons}>
            <Button
              buttonStyle="primary"
              onClick={() => void send().then(closeConfirmation)}
              disabled={(livemode && !isLiveConfirmed) || isLoading}
            >
              {isLoading ? 'Sending…' : 'Confirm send'}
            </Button>
            <Button
              buttonStyle="secondary"
              onClick={closeConfirmation}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      {isSent && <div>Campaign scheduled.</div>}
      {error && <div className={stylesheet.error}>{error}</div>}
    </div>
  );
}
