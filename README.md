# GoLoader — On-Demand Vehicle Loader Booking Platform

> **GoLoader** is a comprehensive marketplace platform that connects shop owners needing on-demand goods transport with independent vehicle owners (loaders). It replaces informal, untracked tempo transport with transparent pricing, live matching, full-lifecycle tracking, and secure payment settlement.
> 
> 

---

## 🚀 Overview & System Vision

Finding reliable transport for goods as a shop owner often involves informal drivers with no tracking, fixed pricing, or accountability. GoLoader solves this by streamlining:

* **On-Demand Load Requests & Matching:** Instant geospatial matching of verified, available loaders within a 10 km radius.


* **Role Isolation Architecture:** Strict authorization middleware ensuring data privacy between shop owners, loaders, and admins.


* **Lifecycle Tracking:** Granular status history tracking from request through delivery.


* **Transparent Settlement:** Automated fare calculations, commission breakdowns, and loader earnings management.



---

## 🛠️ Tech Stack & Architecture

* **Database:** MongoDB (Mongoose) with 2dsphere geospatial indexing.


* **Backend API:** Node.js / Express REST architecture (Base URL: `/api/v1`).


* **Security:** Role-based access control (RBAC), JWT authentication, password hashing.



### Core Database Entities

1. **Users:** Identity, role (`shop_owner`, `loader`, `admin`), and verification status.


2. **Vehicles:** Geospatial tracking, type classifications (`mini_truck`, `tempo`, `pickup`, `e_cart`), and document verification states.


3. **Orders:** GeoJSON pickup/drop coordinates, embedded status timelines, and fare properties.


4. **Supporting Collections:** Payments, Reviews, Notifications, Loader Earnings, and Support Tickets.



---

## 📋 Structural Functional Modules

1. **User & Role Management:** Secure registration/login with hashed credentials and strict role isolation middleware.


2. **Vehicle & Loader Profiles:** Management of transport capacity, documentation status, and real-time availability.


3. **Atomic Order Matching:** Race-condition-safe updates ensuring an order can only be accepted once via atomic database operations.


4. **Fare Calculation Engine:** Dynamically computes fares using distance matrices, vehicle multipliers, and loading charges.


5. **Geospatial Queries:** Rapid radius searching using MongoDB `$near` operators and 2dsphere indexing.


6. **Order Lifecycle Management:** Tracks progression through `requested` $\rightarrow$ `accepted` $\rightarrow$ `arrived` $\rightarrow$ `loaded` $\rightarrow$ `in_transit` $\rightarrow$ `delivered` (or `cancelled`).


7. **Ratings & Analytics:** Automated cache updates for user ratings and aggregation pipelines for earnings/spend insights.



---

## 🔌 REST API Endpoints

All protected endpoints require a valid `Bearer JWT` token.

### 1. Register User

* **URL:** `POST /api/v1/auth/register`

* **Request Body:**
```json
{
  "name": "Ravi Kumar",
  "phone": "+919876543210",
  "password": "SecurePass123!",
  "role": "shop_owner"
}
```[cite: 1]

```


* **Response (`201 Created`):**
```json
{
  "status": "success",
  "user_id": "64f1c2e2a1b2c3d4e5f6a7b8",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```[cite: 1]


```



### 2. Create Order

* **URL:** `POST /api/v1/orders`

* **Request Body:**
```json
{
  "pickup": { "address": "MG Road, Pune", "lng": 73.8567, "lat": 18.5204 },
  "drop": { "address": "Hinjewadi, Pune", "lng": 73.7382, "lat": 18.5912 },
  "goods": { "category": "furniture", "weight_kg": 120 },
  "vehicle_type_requested": "tempo",
  "scheduled_at": null
}
```[cite: 1]

```


* **Response (`201 Created`):**
```json
{
  "status": "success",
  "order_id": "64f1c2e2a1b2c3d4e5f6a7c1",
  "estimated_fare": 480.00,
  "order_status": "requested"
}
```[cite: 1]


```



### 3. Accept Order (Loader)

* **URL:** `PUT /api/v1/orders/:id/accept`

* **Response (`200 OK`):**
```json
{
  "status": "success",
  "order_id": "64f1c2e2a1b2c3d4e5f6a7c1",
  "order_status": "accepted",
  "loader": { "name": "Suresh Patil", "vehicle": "MH12AB1234", "rating_avg": 4.6 }
}
```[cite: 1]


```



### 4. Update Order Status

* **URL:** `PUT /api/v1/orders/:id/status`

* **Request Body:**
```json
{ "status": "delivered", "delivery_otp": "4821" }
```[cite: 1]

```


* **Response (`200 OK`):**
```json
{
  "status": "success",
  "order_status": "delivered",
  "final_fare": 480.00
}
```[cite: 1]

```