# Turing Multi-Agent System Frontend

This is the frontend application for the Turing Multi-Agent System, built with React and TypeScript.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Getting Started

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The application will be available at `http://localhost:5173`.

## Project Structure

```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── Data/      # System architecture visualization components
│   │   └── userInputs/ # User input configuration components
│   ├── pages/         # Page components
│   ├── services/      # API services and utilities
│   ├── styles/        # Global styles and theme
│   └── App.tsx        # Root component
├── public/            # Static assets
└── package.json       # Project dependencies and scripts
```

## Key Features

### System Architecture Visualization
The Data component provides a node-based visualization of the system architecture using ReactFlow, featuring:
- Custom node types for different system components
- Interactive connections between system elements
- Detailed information panels for each node
- Support for multiple flow visualizations

### Comprehensive Input Configuration
The UserInputs component includes:
- ConfigureActivityList: Schedule activities with frequency settings (daily, weekly, monthly)
- QueryTemplates: Manage predefined query templates
- DefaultParameters: Configure system-wide defaults
- InputValidation: Set validation rules
- InputHistory: Track previous inputs

### Enhanced User Experience
- Markdown formatting for agent messages to highlight important information
- Fixed message duplication issues with consistent message IDs
- Improved agent window with better readability

## Available Scripts

- `npm run dev` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run lint` - Runs the linter
- `npm run format` - Formats code using prettier

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is proprietary and confidential.