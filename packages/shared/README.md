# @swarm/shared

Shared utilities, types, and clients used across all Swarm SDKs.

## Installation

```bash
pnpm add @swarm/shared
```

## Features

- **Network Configuration**: Supported blockchain networks (Ethereum, Polygon, Base, BSC)
- **Base API Client**: HTTP client with retry logic and error handling
- **Web3 Helper**: ERC20 token operations using viem
- **Swarm Auth**: Authentication with Swarm platform
- **Remote Config**: Fetch configuration from Swarm services
- **Type Definitions**: Shared types for quotes, trade results, etc.

## Usage

### Network Types

```typescript
import { Network, getNetworkName } from "@swarm/shared";

const network = Network.POLYGON;
console.log(getNetworkName(network)); // "polygon"
```

### Web3 Helper

```typescript
import { Web3Helper, Network } from "@swarm/shared";

const helper = new Web3Helper("0xPrivateKey...", Network.POLYGON);

// Get token balance
const balance = await helper.getBalance("0xTokenAddress");

// Transfer tokens
const txHash = await helper.transferToken("0xRecipient", "0xTokenAddress", 100);
```

### Swarm Auth

```typescript
import { SwarmAuth } from "@swarm/shared";

const auth = new SwarmAuth();
const tokens = await auth.verify("0xPrivateKey...");

console.log(tokens.accessToken);
```

### Base API Client

```typescript
import { BaseAPIClient, APIException } from "@swarm/shared";

class MyClient extends BaseAPIClient {
  constructor() {
    super("https://api.example.com");
  }

  async getData() {
    return this.makeRequest("GET", "/data");
  }
}
```

## Exports

- `Network` - Enum for supported networks
- `Quote` - Quote interface
- `TradeResult` - Trade result interface
- `BaseAPIClient` - Base HTTP client with retries
- `Web3Helper` - Web3 operations helper
- `SwarmAuth` - Authentication client
- `getConfigFetcher` - Remote configuration fetcher
- Various constants and utilities

## License

MIT
