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

import Button from 'shared/components/Button';
import { ColorThemeContext } from 'shared/components/ColorThemeContext';
import ExternalIcon from 'shared/components/ExternalIcon';
import TextButton from 'shared/components/TextButton';
import stylesheet from './Orders.less';
import ToteBagSmallImage from './assets/tote-bag-small-default.png';

const itemDisplayNames: Record<MerchInternalVariant, string> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: 'Tote bag',
};

const itemImages: Record<MerchInternalVariant, string> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: ToteBagSmallImage,
};

function TrackOrderLink({ order }: { order: Order }): JSX.Element {
  if (!order.trackingUrl) {
    return null;
  }
  return (
    <a href={order.trackingUrl} target="_blank" rel="noreferrer">
      Track shipment <ExternalIcon />
    </a>
  );
}

function OrderStatus({ order }: { order: Order }): JSX.Element {
  const { state, fulfillmentState } = order;

  switch (state) {
    case MerchOrderState.BUILDING: {
      const needsCustomization = order.items.some(
        (item) => item.state === MerchItemState.PURCHASED
      );
      if (needsCustomization) {
        return (
          <span>
            Click <i>Customize</i> so I can make you something unique
          </span>
        );
      }
      return <span>Order received.</span>;
    }

    case MerchOrderState.PENDING_SUBMISSION:
    case MerchOrderState.SUBMITTED_FOR_FULFILLMENT:
      switch (fulfillmentState) {
        case undefined:
        case MerchOrderFulfillmentState.DRAFT:
        case MerchOrderFulfillmentState.PENDING:
        case MerchOrderFulfillmentState.IN_PROGRESS:
        case MerchOrderFulfillmentState.PARTIAL:
          return <span>In process.</span>;
        case MerchOrderFulfillmentState.ON_HOLD:
          return <span>On hold. </span>;
        case MerchOrderFulfillmentState.FAILED:
          return <span>Something went wrong</span>;
        case MerchOrderFulfillmentState.CANCELED:
          return <span>Canceled</span>;
        case MerchOrderFulfillmentState.FULFILLED:
          return <span>Order shipped.</span>;
        default:
          return absurd(fulfillmentState);
      }
    case MerchOrderState.CANCELED:
      return <span>Canceled</span>;
    default:
      absurd(state);
  }
}

function OrderItem({ item }: { item: Order['items'][0] }): JSX.Element {
  const { openItemForCustomizing } = useOrdersStore();

  return (
    <li key={item.id} className={stylesheet.orderItem}>
      <img
        src={itemImages[item.internalVariant]}
        alt="Product image"
        className={stylesheet.itemImage}
      />
      <h3 className={stylesheet.itemName}>
        {itemDisplayNames[item.internalVariant]}
      </h3>
      <div className={stylesheet.itemActions}>
        {item.state === MerchItemState.PURCHASED ? (
          <Button
            onClick={() => openItemForCustomizing(item)}
            buttonStyle="primary"
          >
            Customize
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function OrdersList({ orders }: { orders: Order[] }): JSX.Element {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <ul className={stylesheet.ordersList}>
      {orders.map((order) => (
        <li key={order.id} className={stylesheet.order}>
          <h2>{formatter.format(new Date(order.createdAt))}</h2>
          <div>
            <OrderStatus order={order} /> <TrackOrderLink order={order} />
          </div>
          <ol className={stylesheet.orderItems}>
            {order.items.map((item) => (
              <OrderItem key={item.id} item={item} />
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
    <div className={stylesheet.container}>
      <Link to="/">← Back to 1940s.nyc</Link>
      <LoginModal />
      <CustomizeModal />
      <aside className={stylesheet.aside}>
        <ColorThemeContext.Provider value="dark">
          <p>
            Not showing your orders?{' '}
            <TextButton onClick={openLogin}>
              Log into another account
            </TextButton>
            .
          </p>
          <p>
            For support email{' '}
            <a href="mailto:julian@1940.nyc">julian@1940s.nyc</a>
          </p>
        </ColorThemeContext.Provider>
      </aside>
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
