# Simmer Down - Entity Relationship Diagram

## Full Schema ERD

```mermaid
erDiagram
    profiles ||--o{ orders : "places"
    profiles {
        uuid id PK
        text email
        text full_name
        text phone
        int loyalty_points
        text loyalty_tier
        text role
        timestamptz created_at
        timestamptz updated_at
    }

    locations ||--o{ orders : "receives"
    locations ||--o{ events : "hosts"
    locations ||--o{ operating_hours : "has"
    locations {
        uuid id PK
        text name
        text address
        text phone
        text hours_weekday
        text hours_weekend
        decimal lat
        decimal lng
        boolean is_open
        boolean delivery_available
        timestamptz created_at
    }

    menu_items ||--o{ specials : "featured_in"
    menu_items {
        uuid id PK
        text name
        text description
        decimal price
        text image_url
        text category
        text size
        text_array tags
        boolean available
        timestamptz created_at
    }

    orders {
        uuid id PK
        text order_number UK
        uuid customer_id FK
        uuid location_id FK
        text customer_name
        text customer_phone
        text customer_email
        text delivery_address
        boolean is_delivery
        jsonb items_json
        text items_description
        decimal subtotal
        decimal delivery_fee
        decimal discount
        decimal total
        text payment_method
        text payment_status
        text status
        text notes
        timestamptz estimated_ready_at
        timestamptz delivered_at
        timestamptz created_at
        timestamptz updated_at
    }

    contact_submissions {
        uuid id PK
        text name
        text email
        text phone
        text reason
        text message
        text status
        text notes
        timestamptz created_at
    }

    events ||--o{ event_registrations : "has"
    events {
        uuid id PK
        text title
        text description
        timestamptz event_date
        timestamptz end_date
        uuid location_id FK
        text location_name
        int capacity
        int registrations_count
        text image_url
        text category
        decimal price_amount
        text price_display
        boolean is_featured
        boolean is_active
        boolean is_recurring
        text recurrence_rule
        timestamptz created_at
        timestamptz updated_at
    }

    event_registrations {
        uuid id PK
        uuid event_id FK
        text customer_name
        text customer_email
        text customer_phone
        int party_size
        text status
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    specials {
        uuid id PK
        text title
        text description
        text discount_type
        decimal discount_value
        int discount_percentage
        decimal original_price
        decimal special_price
        uuid menu_item_id FK
        date start_date
        date end_date
        int_array day_of_week
        time start_time
        time end_time
        boolean is_featured
        boolean is_active
        text image_url
        timestamptz created_at
        timestamptz updated_at
    }

    operating_hours {
        uuid id PK
        uuid location_id FK
        int day_of_week
        time open_time
        time close_time
        boolean is_closed
        boolean is_24_hours
        timestamptz created_at
        timestamptz updated_at
    }

    customers {
        uuid id PK
        text phone UK
        text name
        text email
        int loyalty_points
        text loyalty_tier
        int total_orders
        decimal total_spent
        timestamptz last_order_at
        timestamptz created_at
        timestamptz updated_at
    }

    loyalty_tiers {
        uuid id PK
        text tier_name UK
        int points_required
        int discount_percentage
        jsonb perks
        timestamptz created_at
        timestamptz updated_at
    }
```

## Simplified Core Relationships

```mermaid
graph TD
    L[Locations] --> E[Events]
    L --> O[Operating Hours]
    L --> OR[Orders]

    E --> ER[Event Registrations]

    M[Menu Items] --> S[Specials]

    OR --> C[Customers]

    P[Profiles] --> OR

    LT[Loyalty Tiers] -.config.-> C
```

## Data Flow Diagrams

### Event Registration Flow
```mermaid
sequenceDiagram
    participant U as User
    participant ER as event_registrations
    participant E as events
    participant T as Trigger

    U->>ER: INSERT registration
    ER->>T: Fire trigger
    T->>E: UPDATE registrations_count += party_size
    E-->>U: Return updated count
```

### Order Completion Flow
```mermaid
sequenceDiagram
    participant A as Admin
    participant O as orders
    participant T as Trigger
    participant C as customers

    A->>O: UPDATE status = 'delivered'
    O->>T: Fire trigger
    T->>C: UPSERT customer stats
    Note over C: total_orders += 1<br/>total_spent += order.total<br/>last_order_at = now()
    C-->>A: Return updated customer
```

## Table Dependencies (for migration order)

```mermaid
graph LR
    profiles[profiles]
    locations[locations]
    menu_items[menu_items]
    loyalty_tiers[loyalty_tiers]

    profiles --> orders
    locations --> orders
    locations --> events
    locations --> operating_hours
    events --> event_registrations
    menu_items --> specials
    orders -.trigger.-> customers
    loyalty_tiers -.reference.-> customers
```

## Access Control Matrix

| Table | Public Read | Public Insert | User Read Own | User Update Own | Admin Full |
|-------|-------------|---------------|---------------|-----------------|------------|
| profiles | ✓ | ✗ | ✓ | ✓ | ✓ |
| menu_items | ✓ | ✗ | ✓ | ✗ | ✓ |
| locations | ✓ | ✗ | ✓ | ✗ | ✓ |
| orders | ✗ | ✓ | ✓ | ✗ | ✓ |
| contact_submissions | ✗ | ✓ | ✗ | ✗ | ✓ |
| events | ✓ (active) | ✗ | ✓ | ✗ | ✓ |
| event_registrations | ✗ | ✓ | ✓ | ✗ | ✓ |
| specials | ✓ (active) | ✗ | ✓ | ✗ | ✓ |
| operating_hours | ✓ | ✗ | ✓ | ✗ | ✓ |
| customers | ✗ | ✓ | ✓ | ✗ | ✓ |
| loyalty_tiers | ✓ | ✗ | ✓ | ✗ | ✓ (admin only) |

## Index Coverage Map

```mermaid
graph TD
    E[events table]
    E --> ED[idx_events_event_date]
    E --> EF[idx_events_active_featured]
    E --> EL[idx_events_location_id]
    E --> EC[idx_events_category]

    O[orders table]
    O --> OP[idx_orders_customer_phone]
    O --> OS[idx_orders_status]
    O --> OL[idx_orders_location_id]
    O --> OC[idx_orders_created_at]

    C[customers table]
    C --> CP[idx_customers_phone]
    C --> CE[idx_customers_email]
    C --> CL[idx_customers_loyalty_tier]

    S[specials table]
    S --> SD[idx_specials_active_dates]
    S --> SM[idx_specials_menu_item]
    S --> SF[idx_specials_featured]
```

## Trigger Flow

```mermaid
graph TD
    subgraph "Auto-Update Triggers"
    A[events UPDATE] --> AT[events_updated_at trigger]
    B[orders UPDATE] --> BT[orders_updated_at trigger]
    C[specials UPDATE] --> CT[specials_updated_at trigger]
    D[customers UPDATE] --> DT[customers_updated_at trigger]
    end

    subgraph "Business Logic Triggers"
    E[event_registrations INSERT/UPDATE/DELETE] --> ET[event_registrations_count_trigger]
    ET --> EU[Update events.registrations_count]

    F[orders UPDATE status='delivered'] --> FT[orders_update_customer_stats]
    FT --> FU[UPSERT customers record]
    end
```

## Schema Versioning

```mermaid
timeline
    title Simmer Down Schema Evolution
    v1.0.0 : Core tables
         : profiles, menu_items, locations, orders, contact_submissions
    v1.5.0 : Basic admin
         : events table added
    v2.0.0 : Complete admin
         : event_registrations, specials, operating_hours
         : customers, loyalty_tiers
         : 20+ indexes, comprehensive RLS
         : Business logic triggers
```

## Query Pattern Analysis

```mermaid
pie title Common Query Types
    "Event Lookups (by date)" : 25
    "Order Status Queries" : 30
    "Customer Lookups (by phone)" : 20
    "Menu/Special Queries" : 15
    "Location/Hours Queries" : 10
```

## Performance Optimization Zones

```mermaid
graph LR
    subgraph "Hot Path (indexed)"
    A[Upcoming Events]
    B[Pending Orders]
    C[Customer by Phone]
    D[Active Specials]
    end

    subgraph "Warm Path (indexed with filters)"
    E[Event Registrations]
    F[Order History]
    G[Menu by Category]
    end

    subgraph "Cold Path (admin only)"
    H[Full Customer List]
    I[All Contact Forms]
    J[Historical Analytics]
    end
```

## Realtime Channels

```mermaid
graph TD
    subgraph "Realtime Enabled Tables"
    O[orders]
    E[events]
    ER[event_registrations]
    S[specials]
    end

    O --> RT1[Kitchen Display Channel]
    E --> RT2[Event Updates Channel]
    ER --> RT3[Registration Counter Channel]
    S --> RT4[Promotions Channel]
```

---

**Viewing Instructions:**

This ERD uses Mermaid syntax. To view:

1. **GitHub**: Auto-renders in markdown preview
2. **VS Code**: Install "Markdown Preview Mermaid Support" extension
3. **Online**: Paste in https://mermaid.live/
4. **Documentation Tools**: Most support Mermaid natively (GitBook, Notion, etc.)

**Legend:**
- `PK` = Primary Key
- `FK` = Foreign Key
- `UK` = Unique Key
- `||--o{` = One to Many relationship
- `}o--o{` = Many to Many relationship
- `-.->` = Reference/Soft relationship
