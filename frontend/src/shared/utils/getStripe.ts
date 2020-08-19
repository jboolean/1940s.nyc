import { loadStripe, Stripe } from '@stripe/stripe-js';

const KEY = __DEV__
  ? 'pk_test_51HHaB6FCLBtNZLVl2eku10yXOnLMuYmiXDmK2iMo562DrZePotrkn49Acj7AINohiWzuUrgIp4OUDPRkbuvolmPo00x1AHBQLy'
  : 'pk_live_51HHaB6FCLBtNZLVlMeayLWhx5BMoidrPcqanVOaZd66qBNNcctULlwZqv5sSb5SQprn9NcRCobPDEBIMK2FSm5K200pXw2Hkkb';

export default function getStripe(): Promise<Stripe> {
  return loadStripe(KEY);
}
