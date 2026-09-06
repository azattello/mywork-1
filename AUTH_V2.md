# Auth V2

Auth V2 is isolated from the existing `Auth`, `Reg`, and `/api/auth/*` flow.

## Frontend

The new screen is registered as `AuthV2` in the root navigator. It supports:

- phone and password login;
- SMS passwordless login;
- phone verification during registration;
- SMS 2FA after password login;
- password recovery by SMS;
- OTP expiry, attempt limits, resend cooldown, and loading/error states.

Navigate to `AuthV2` when testing the new flow. The legacy `Auth` route remains unchanged.

## Backend routes

All new routes are under `/api/auth-v2`:

- `POST /registration/start`
- `POST /registration/verify`
- `POST /sms-login/start`
- `POST /sms-login/verify`
- `POST /password/login`
- `POST /2fa/verify`
- `PATCH /2fa` (authenticated)
- `POST /password-reset/start`
- `POST /password-reset/complete`

OTP values are stored only as hashes in `AuthChallenge`. Challenges expire, are single-use, and have a maximum attempt count.

## SMS provider

The provider adapter is `backend/src/services/smsService.js`. Production must use a real provider:

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=...
```

For local development only, set `AUTH_RETURN_DEV_OTP=true` to receive `developmentCode` in the API response. This is disabled by default and must not be enabled in production.

Defaults are configurable with `AUTH_OTP_TTL_MS`, `AUTH_OTP_RESEND_COOLDOWN_MS`, and `AUTH_OTP_MAX_ATTEMPTS`.

## Tests

```bash
cd backend
npx jest src/tests/auth-v2.test.js --runInBand
```