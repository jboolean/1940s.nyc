import React from 'react';
import Button from 'shared/components/Button';
import { API_BASE } from 'shared/utils/apiConstants';
import { MerchItemState, Order, OrderItem } from 'shared/utils/merch/Order';
import stylesheet from './ReviewMerch.less';
import useReviewMerchStore from './stores/ReviewMerchStore';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
});

function OrderMetadataView({ order }: { order: Order }): JSX.Element {
  return (
    <div className={stylesheet.metadata}>
      <div>
        <strong>Order #{order.id}</strong>
      </div>
      <div>
        <time dateTime={order.createdAt}>
          {DATE_FORMATTER.format(Date.parse(order.createdAt))}
        </time>
      </div>
      {order.email && <div>Email: {order.email}</div>}
      <div>State: {order.state}</div>
      {order.fulfillmentState && (
        <div>Fulfillment: {order.fulfillmentState}</div>
      )}
    </div>
  );
}

function OrderItemView({ item }: { item: OrderItem }): JSX.Element {
  return (
    <div className={stylesheet.item}>
      <div>Item #{item.id}</div>
      <div>Variant: {item.internalVariant}</div>
      <div>State: {item.state}</div>
      {[
        MerchItemState.READY_FOR_FULFILLMENT,
        MerchItemState.ADDED_TO_ORDER,
      ].includes(item.state) && (
        <div>
          <a
            href={`${API_BASE}/merch/items/${item.id}/printfile`}
            target="_blank"
            rel="noreferrer"
            className={stylesheet.printfileLink}
          >
            View Printfile
          </a>
        </div>
      )}
      {item.customizationOptions && (
        <div className={stylesheet.customization}>
          <strong>Customization:</strong>
          <div>Style: {item.customizationOptions.style}</div>
          <div>Foreground: {item.customizationOptions.foregroundColor}</div>
          <div>Background: {item.customizationOptions.backgroundColor}</div>
          <div>
            Location: {item.customizationOptions.lat},{' '}
            {item.customizationOptions.lng}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewMerch(): JSX.Element {
  const reviewMerchStore = useReviewMerchStore();

  React.useEffect(() => {
    reviewMerchStore.loadOrders();
    reviewMerchStore.loadOrdersNeedingAttention();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={stylesheet.container}>
      <h1>Review Merch Orders</h1>

      <div className={stylesheet.orders}>
        {reviewMerchStore.orders.map((order) => (
          <div key={order.id} className={stylesheet.order}>
            <div className={stylesheet.orderHeader}>
              <OrderMetadataView order={order} />

              <div className={stylesheet.buttons}>
                <Button
                  onClick={() => reviewMerchStore.fulfillOrder(order.id)}
                  buttonStyle={'primary'}
                >
                  Fulfill
                </Button>
                <Button
                  onClick={() => reviewMerchStore.cancelOrder(order.id)}
                  buttonStyle={'secondary'}
                >
                  Cancel
                </Button>
              </div>
            </div>

            <div className={stylesheet.items}>
              <h3>Items ({order.items.length})</h3>
              {order.items.map((item) => (
                <OrderItemView key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {reviewMerchStore.ordersNeedingAttention.length > 0 && (
        <div className={stylesheet.attentionSection}>
          <h2>Orders Needing Attention</h2>
          <div className={stylesheet.orders}>
            {reviewMerchStore.ordersNeedingAttention.map((order) => (
              <div key={order.id} className={stylesheet.order}>
                <OrderMetadataView order={order} />
                <div className={stylesheet.items}>
                  <h3>Items ({order.items.length})</h3>
                  {order.items.map((item) => (
                    <OrderItemView key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
