import axios, { HttpStatusCode } from 'axios';
import api from 'shared/utils/api';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const STATUSES_WITH_MESSAGES: number[] = [HttpStatusCode.BadRequest];

interface State {
  template: string;
  livemode: boolean;
  sendOn: string;
  isLoading: boolean;
  isSent: boolean;
  error: string | null;
}

interface Actions {
  setTemplate(template: string): void;
  setLivemode(livemode: boolean): void;
  setSendOn(sendOn: string): void;
  send(): Promise<void>;
}

const useEmailCampaignStore = create(
  immer<State & Actions>((set, get) => ({
    template: '',
    livemode: false,
    sendOn: '',
    isLoading: false,
    isSent: false,
    error: null,
    setTemplate: (template) => {
      set((state) => {
        state.template = template;
      });
    },
    setLivemode: (livemode) => {
      set((state) => {
        state.livemode = livemode;
      });
    },
    setSendOn: (sendOn) => {
      set((state) => {
        state.sendOn = sendOn;
      });
    },
    send: async () => {
      const { template, livemode, sendOn } = get();
      set((state) => {
        state.isLoading = true;
        state.isSent = false;
        state.error = null;
      });
      try {
        await api.post('/email-campaigns/send-campaign', {
          template,
          livemode,
          // Date-only strings parse as UTC midnight; send local midnight instead.
          sendOn: new Date(`${sendOn}T00:00`),
        });
        set((state) => {
          state.isSent = true;
        });
      } catch (err) {
        console.error('Sending campaign failed', err);
        const serverMessage =
          axios.isAxiosError<{ error?: string }>(err) &&
          err.response &&
          STATUSES_WITH_MESSAGES.includes(err.response.status)
            ? err.response.data?.error
            : undefined;
        set((state) => {
          state.error = serverMessage ?? 'Sending campaign failed. Try again.';
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },
  }))
);

export default useEmailCampaignStore;
