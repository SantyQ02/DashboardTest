# SaveApp Dashboard API Documentation

## Base URL

```
http://localhost:3001/api
```

## Endpoints

### Health Check

- **GET** `/ping`
- **Description**: Health check endpoint
- **Response**:

```json
{
  "message": "pong",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## Cards API

### Get All Cards

- **GET** `/cards`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `sort` (optional): Sort field (default: createdAt)
  - `order` (optional): Sort order - "asc" or "desc" (default: desc)
  - `search` (optional): Search term for name, brand, category, bank, or rewards
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "brand": "string",
      "category": "string",
      "bank": "string",
      "annualFee": "number",
      "interestRate": "number",
      "creditLimit": "number",
      "rewards": "string",
      "benefits": ["string"],
      "requirements": ["string"],
      "status": "active|inactive",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

### Get Card by ID

- **GET** `/cards/:id`
- **Response**:

```json
{
  "success": true,
  "data": {
    "_id": "string",
    "name": "string",
    "brand": "string",
    "category": "string",
    "bank": "string",
    "annualFee": "number",
    "interestRate": "number",
    "creditLimit": "number",
    "rewards": "string",
    "benefits": ["string"],
    "requirements": ["string"],
    "status": "active|inactive",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Create Card

- **POST** `/cards`
- **Body**:

```json
{
  "name": "string (required)",
  "brand": "string (required)",
  "category": "string (required)",
  "bank": "string (required)",
  "annualFee": "number (required, min: 0)",
  "interestRate": "number (required, min: 0)",
  "creditLimit": "number (required, min: 0)",
  "rewards": "string (required)",
  "benefits": ["string"],
  "requirements": ["string"],
  "status": "active|inactive (default: active)"
}
```

- **Response**:

```json
{
  "success": true,
  "data": "created_card_object",
  "message": "Card created successfully"
}
```

### Update Card

- **PUT** `/cards/:id`
- **Body**: Same as Create Card (all fields optional)
- **Response**:

```json
{
  "success": true,
  "data": "updated_card_object",
  "message": "Card updated successfully"
}
```

### Delete Card

- **DELETE** `/cards/:id`
- **Response**:

```json
{
  "success": true,
  "message": "Card deleted successfully"
}
```

## Banks API

### Get All Banks

- **GET** `/banks`
- **Query Parameters**: Same as Cards (page, limit, sort, order, search)
- **Search**: Searches in name, code, country, and email fields
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "code": "string",
      "country": "string",
      "website": "string",
      "phone": "string",
      "email": "string",
      "address": "string",
      "status": "active|inactive",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

### Get Bank by ID

- **GET** `/banks/:id`
- **Response**: Single bank object

### Create Bank

- **POST** `/banks`
- **Body**:

```json
{
  "name": "string (required)",
  "code": "string (required, unique)",
  "country": "string (required)",
  "website": "string (required)",
  "phone": "string (required)",
  "email": "string (required)",
  "address": "string (required)",
  "status": "active|inactive (default: active)"
}
```

### Update Bank

- **PUT** `/banks/:id`
- **Body**: Same as Create Bank (all fields optional)

### Delete Bank

- **DELETE** `/banks/:id`

## Categories API

### Get All Categories

- **GET** `/categories`
- **Query Parameters**: Same as Cards (page, limit, sort, order, search)
- **Search**: Searches in name and description fields
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "color": "string",
      "icon": "string",
      "status": "active|inactive",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

### Get Category by ID

- **GET** `/categories/:id`
- **Response**: Single category object

### Create Category

- **POST** `/categories`
- **Body**:

```json
{
  "name": "string (required, unique)",
  "description": "string (required)",
  "color": "string (required, default: #3B82F6)",
  "icon": "string (required)",
  "status": "active|inactive (default: active)"
}
```

### Update Category

- **PUT** `/categories/:id`
- **Body**: Same as Create Category (all fields optional)

### Delete Category

- **DELETE** `/categories/:id`

## Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "field_name": {
      "message": "Validation message"
    }
  }
}
```

### Not Found Error (404)

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Internal Server Error (500)

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (only in development)"
}
```

## Examples

### Get cards with pagination and search

```
GET /api/cards?page=1&limit=5&search=santander&sort=name&order=asc
```

### Create a new card

```bash
curl -X POST http://localhost:3001/api/cards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Card",
    "brand": "Visa",
    "category": "Travel",
    "bank": "Test Bank",
    "annualFee": 50,
    "interestRate": 15.5,
    "creditLimit": 5000,
    "rewards": "2% cashback on travel",
    "benefits": ["Travel insurance", "No foreign fees"],
    "requirements": ["Good credit score", "Minimum income"]
  }'
```

### Update a card

```bash
curl -X PUT http://localhost:3001/api/cards/CARD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "annualFee": 60,
    "status": "inactive"
  }'
```
