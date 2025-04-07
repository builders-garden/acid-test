## This template provides a minimal setup to get Next.js working with MiniKit and Frames.js 

## Setup

```bash
cp .env.example .env
yarn 
yarn dev

```

To run as a mini app choose a production app in the dev portal and use NGROK to tunnel. Set the `NEXTAUTH_URL` and the redirect url if using sign in with worldcoin to that ngrok url

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To use the application, you'll need to:

## Frames.js

- **Generate the account credentials**
  1. Run `yarn frames`
  2. Select `Frames v2`
  3. Sign in with Farcaster (you have to pay 10 warps on Warpcast)
  4. Now you can associate your domain with the account
     - Click `Generate` on Domain Account Association
     - Insert the domain you are using (default to `http://localhost:3000/`)
     - Then you will be asked to sign with your wallet to generate the signature
     - Copy the JSON object and paste it in the `account` object in the file `public/.well-known/farcaster.json`
        ```json
        {
          "account": { // paste it here
            "header": "...",
            "payload": "...",
            "signature": "..."
          },
          "frame": {
            ...
          }
        }
        ```
     - Now you can debug your frame locally


## WorldCoin

1. **Get World ID Credentials**
   From the [World ID Developer Portal](https://developer.worldcoin.org/):

   - Create a new app to get your `APP_ID`
   - Get `DEV_PORTAL_API_KEY` from the API Keys section
   - Navigate to "Sign in with World ID" page to get:
     - `WLD_CLIENT_ID`
     - `WLD_CLIENT_SECRET`

2. **Configure Action**
   - In the Developer Portal, create an action in the "Incognito Actions" section
   - Use the same action name in `components/Verify/index.tsx`

View docs: [Docs](https://docs.world.org/)

[Developer Portal](https://developer.worldcoin.org/)


## Deploy

Remember to update your env variables accordingly, especially 
```bash
NEXT_PUBLIC_URL="https://your-domain.com"
NEXT_PUBLIC_APP_ENV="production" # Eruda provider
```
