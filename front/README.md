# SubTrack Frontend

React-based frontend for the SubTrack subscription management application.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Recharts** - Charts and analytics
- **Lucide React** - Icons

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE=http://localhost:8080" > .env.local

# Start development server
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
front/
├── App.tsx           # Main app component with routing
├── components/       # React components
│   ├── Dashboard.tsx     # Dashboard view
│   ├── Settings.tsx      # Settings page
│   └── SubscriptionList.tsx  # Subscription management
├── services/         # API services
│   └── storageService.ts # API client
├── types.ts          # TypeScript type definitions
├── constants.ts      # App constants and translations
└── index.tsx         # Entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE` | Backend API URL | `http://localhost:8080` |

## License

MIT - See [LICENSE](../LICENSE) for details.
