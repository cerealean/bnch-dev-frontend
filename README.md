# JavaScript Benchmarker

A powerful web application for benchmarking JavaScript code performance with statistical precision. Built with Angular 20+ and the `@bnch/benchmarker` library.

## Features

- **Large Code Input Area**: Spacious textarea with syntax highlighting for JavaScript code
- **Real-time Benchmarking**: Execute and measure JavaScript code performance with statistical precision
- **Comprehensive Results**: Detailed performance metrics including:
  - Mean, median, min, max execution times
  - Operations per second
  - Standard deviation and coefficient of variation
  - Sample collection statistics
- **Tabbed Results Display**: Organized view of benchmark results with multiple tabs for overview, detailed statistics, and configuration
- **Modern UI**: Built with Angular Material for a clean, responsive interface
- **Worker Isolation**: Secure code execution using web workers
- **Error Handling**: Comprehensive error reporting for failed benchmarks

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bnch-dev-frontend
```

2. Install dependencies:
```bash
npm install
```

### Development Server

To start a local development server, run:

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you modify source files.

## Usage

1. **Enter JavaScript Code**: Type or paste your JavaScript code in the large textarea
2. **Run Benchmark**: Click the "Run Benchmark" button to start performance measurement
3. **View Results**: Analyze the comprehensive results displayed in organized tabs:
   - **Overview**: Key performance metrics at a glance
   - **Statistics**: Detailed statistical analysis
   - **Configuration**: Benchmark settings used

### Example Code

Try benchmarking different algorithms:

```javascript
// Array iteration benchmark
let sum = 0;
for (let i = 0; i < 10000; i++) {
  sum += i;
}
return sum;
```

```javascript
// String manipulation benchmark
let text = "Hello World";
for (let i = 0; i < 1000; i++) {
  text = text.split("").reverse().join("");
}
return text;
```

## Architecture

- **Frontend**: Angular 20+ with zoneless change detection
- **UI Components**: Angular Material for consistent design
- **Benchmarking**: `@bnch/benchmarker` library for accurate performance measurement
- **Styling**: SCSS with responsive design
- **Build System**: Angular CLI with Vite

## Project Structure

```
src/
├── app/
│   ├── app.ts              # Main component with benchmarking logic
│   ├── app.html            # Template with code input and results display
│   ├── app.scss            # Component styles
│   ├── app.config.ts       # App configuration with Material providers
│   └── app.routes.ts       # Routing configuration
├── styles.scss             # Global styles with Material theme
└── index.html              # App entry point
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode
- `npm test` - Run unit tests

## Technologies Used

- **Angular 20+** - Modern web framework with signals and zoneless change detection
- **Angular Material** - UI component library
- **@bnch/benchmarker** - JavaScript benchmarking library with web worker isolation
- **TypeScript** - Type-safe JavaScript
- **SCSS** - Enhanced CSS with variables and mixins
- **RxJS** - Reactive programming library

## Performance Features

The benchmarker includes several performance optimization features:

- **Web Worker Isolation**: Code execution in isolated workers for security and accuracy
- **Statistical Sampling**: Multiple iterations with warmup periods
- **Adaptive Timing**: Automatic adjustment of sample counts based on execution time
- **Memory Safety**: Controlled execution environment with timeouts

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
