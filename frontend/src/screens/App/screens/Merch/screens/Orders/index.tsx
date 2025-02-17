import React, { useEffect } from 'react';

import { Link } from 'react-router-dom';
import absurd from 'shared/utils/absurd';
import CustomizeModal from './components/CustomizeModal';
import LoginModal from './components/LoginModal';
import useOrdersStore from './shared/stores/OrdersStore';
import {
  MerchInternalVariant,
  MerchItemState,
  MerchOrderFulfillmentState,
  MerchOrderState,
  Order,
} from './shared/utils/Order';

const itemDisplayNames: Record<MerchInternalVariant, string> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: 'Tote bag',
};

function OrderStatus({ order }: { order: Order }): JSX.Element {
  const { state, fulfillmentState, trackingUrl } = order;
  const trackingText = trackingUrl ? (
    <>
      {' '}
      <a href={trackingUrl} target="_blank" rel="noreferrer">
        Click to track shipment
      </a>
      .
    </>
  ) : null;
  switch (state) {
    case MerchOrderState.BUILDING:
      // Not sure what to say here, it could require customization or being internally processed.
      return null;
    case MerchOrderState.PENDING_SUBMISSION:
    case MerchOrderState.SUBMITTED_FOR_FULFILLMENT:
      switch (fulfillmentState) {
        case undefined:
        case MerchOrderFulfillmentState.DRAFT:
        case MerchOrderFulfillmentState.PENDING:
        case MerchOrderFulfillmentState.IN_PROGRESS:
        case MerchOrderFulfillmentState.PARTIAL:
          return <span>Order is in process.{trackingText}</span>;
        case MerchOrderFulfillmentState.ON_HOLD:
          return <span>Order is on hold. {trackingText}</span>;
        case MerchOrderFulfillmentState.FAILED:
          return <span>Something went wrong</span>;
        case MerchOrderFulfillmentState.CANCELED:
          return <span>Order canceled</span>;
        case MerchOrderFulfillmentState.FULFILLED:
          return <span>Order has been sent out. {trackingText}</span>;
        default:
          return absurd(fulfillmentState);
      }
    case MerchOrderState.CANCELED:
      return <span>Canceled</span>;
    default:
      absurd(state);
  }
}

function OrdersList({ orders }: { orders: Order[] }): JSX.Element {
  const { openItemForCustomizing } = useOrdersStore();
  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          <h2>Order #{order.id}</h2>
          <div>
            <OrderStatus order={order} />
          </div>
          <ol>
            {order.items.map((item) => (
              <li key={item.id}>
                <h3>{itemDisplayNames[item.internalVariant]}</h3>
                {item.state === MerchItemState.PURCHASED ? (
                  <button onClick={() => openItemForCustomizing(item)}>
                    Customize
                  </button>
                ) : null}
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ul>
  );
}

export default function Orders(): JSX.Element {
  const { orders, initialize: loadOrders, openLogin } = useOrdersStore();

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <div>
      <Link to="/">Back to home</Link>
      <LoginModal />
      <CustomizeModal />
      <p>
        Not showing your orders?{' '}
        <button onClick={openLogin}>Log into another account</button>.
      </p>
      <h1>Orders</h1>
      <div>
        {orders ? (
          orders.length > 0 ? (
            <OrdersList orders={orders} />
          ) : (
            <p>You have no orders.</p>
          )
        ) : null}
      </div>
    </div>
  );
}
