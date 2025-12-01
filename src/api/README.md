# API Module Documentation

This directory contains all API-related code, organized in a modular and maintainable structure.

## 📁 Directory Structure

```
api/
├── config.ts          # API configuration (base URLs, endpoints, constants)
├── types.ts           # TypeScript interfaces and types
├── utils.ts           # Utility functions (headers, error handling, etc.)
├── endpoints/         # API endpoint implementations
│   └── student.ts    # Student-related API endpoints
├── index.ts          # Main export file
└── README.md         # This file
```

## 🚀 Usage

### Basic Import
```typescript
import { api } from '../api';

// Login
const result = await api.login(email, password);

// Signup
const result = await api.signup(signupData);

// Logout
const result = await api.logout();
```

### Advanced Import
```typescript
import { studentApi, API_BASE_URL, getAuthToken } from '../api';

// Direct access to student API
const profile = await studentApi.getProfile();

// Access configuration
console.log(API_BASE_URL);

// Get auth token
const token = getAuthToken();
```

## 📝 API Endpoints

### Student Endpoints

#### `api.signup(signupData: SignupRequest)`
Creates a new student account.

**Request:**
```typescript
{
  name: string;
  email: string;
  password: string;
  studentLevel: string;
  contactNumber: string;
  profileImage?: File;
  addresses?: Address[];
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data?: LoginResponse;
  errors?: string[];
}
```

#### `api.login(email: string, password: string)`
Authenticates a student and returns a token.

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data?: LoginResponse; // Includes token
  errors?: string[];
}
```

#### `api.logout()`
Logs out the current student session.

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

#### `api.getProfile()`
Fetches the current student's profile.

#### `api.updateProfile(profileData: Partial<SignupRequest>)`
Updates the current student's profile.

## 🔧 Configuration

### Base URL
The API base URL is configured in `config.ts`:
```typescript
export const API_BASE_URL = 'https://7bb3rgsz-3000.inc1.devtunnels.ms';
```

### Endpoints
All endpoints are defined in `config.ts`:
```typescript
export const API_ENDPOINTS = {
  STUDENTS: {
    SIGNUP: '/api/students/signup',
    LOGIN: '/api/students/login',
    LOGOUT: '/api/students/logout',
    // ...
  },
};
```

## 🛠️ Utilities

### `getAuthToken()`
Retrieves the authentication token from localStorage.

### `isDemoMode()`
Checks if the current session is in demo mode.

### `buildHeaders(requireAuth, contentType)`
Builds request headers with optional authentication.

### `handleResponse<T>(response)`
Handles API responses and converts them to a standardized format.

### `fetchWithTimeout(url, options)`
Creates a fetch request with timeout support.

### `handleNetworkError(error)`
Handles network errors and returns a standardized error response.

## 📦 Types

All TypeScript types are defined in `types.ts`:
- `ApiResponse<T>` - Generic API response
- `LoginResponse` - Login response with token
- `SignupRequest` - Signup request data
- `Address` - Address structure
- `User` - User/Student interface
- And more...

## ✨ Features

- ✅ **Type Safety**: Full TypeScript support
- ✅ **Error Handling**: Centralized error handling
- ✅ **Timeout Support**: Request timeout handling
- ✅ **Auth Management**: Automatic token management
- ✅ **Demo Mode**: Support for demo/offline mode
- ✅ **Modular**: Easy to extend with new endpoints
- ✅ **Maintainable**: Clean separation of concerns

## 🔄 Adding New Endpoints

1. Add endpoint to `config.ts`:
```typescript
export const API_ENDPOINTS = {
  STUDENTS: {
    // ... existing endpoints
    NEW_ENDPOINT: '/api/students/new-endpoint',
  },
};
```

2. Add function to `endpoints/student.ts`:
```typescript
export const studentApi = {
  // ... existing functions
  newEndpoint: async (data: NewRequest): Promise<ApiResponse<NewResponse>> => {
    // Implementation
  },
};
```

3. Export in `index.ts`:
```typescript
export const api = {
  // ... existing exports
  newEndpoint: studentApi.newEndpoint,
};
```

## 📚 Best Practices

1. Always use the `api` object for API calls
2. Handle errors using the `success` field in responses
3. Use TypeScript types for type safety
4. Check `isDemoMode()` before making authenticated requests
5. Use `handleNetworkError()` for error handling

