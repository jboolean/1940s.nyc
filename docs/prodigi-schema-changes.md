# Prodigi schema changes

There are no migrations. Apply each section to staging (`fourtiesnyc_staging`, shared with local dev) first, then to production (`fourtiesnyc`), before deploying the matching code. Every change is additive or backward compatible, so the previously deployed code keeps working against the new schema.

## PR 1: provider abstraction

Changes `merch_orders.provider_order_id` to text so provider ids that are not integers (Prodigi order ids such as `ord_123`) fit, and adds a table with one row per shipment.

Backward compatibility: existing integer ids are cast to their decimal string. The old code reads the id as a string and passes it to Printful as a path parameter, and queries by it with a numeric parameter that Postgres coerces to the column type.

```sql
BEGIN;

ALTER TABLE merch_orders
  ALTER COLUMN provider_order_id TYPE varchar USING provider_order_id::varchar;

CREATE TABLE merch_shipments (
  id serial PRIMARY KEY,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  order_id integer NOT NULL REFERENCES merch_orders (id),
  provider_shipment_id varchar NOT NULL,
  tracking_url varchar,
  tracking_number varchar,
  carrier varchar
);

CREATE UNIQUE INDEX merch_shipments_order_provider_shipment_idx
  ON merch_shipments (order_id, provider_shipment_id);

COMMIT;
```

Check the existing timestamp column type first (`\d merch_orders`) and use the same type (`timestamp` vs `timestamptz`) for `created_at` and `updated_at`.
