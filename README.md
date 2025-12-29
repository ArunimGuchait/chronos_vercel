# Chronos Task Tracker

A modern, productivity-focused task and time tracking application built with React and TypeScript. Track your work sessions across multiple workspaces with a clean, minimalist interface.

## Features

- **Multi-Workspace Support**: Organize your tasks across different workspaces (e.g., Personal, Work, Projects)
- **Real-Time Timer**: Start and stop task tracking with a live elapsed time counter
- **Task Tags**: Categorize tasks with custom tags for better organization
- **History View**: Browse all completed tasks with full details
- **Statistics Dashboard**: Visualize your productivity with a 7-day focus chart
- **CSV Export**: Export monthly task data to CSV for analysis
- **Local Storage**: All data is persisted locally in your browser
- **Mobile-Friendly**: Responsive design optimized for mobile devices
- **Modern UI**: Clean interface with JetBrains Mono font and Tailwind CSS

## Tech Stack

- **React 18.3.1** - UI framework
- **TypeScript 5.0** - Type safety
- **Vite 5.0** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vercel Analytics** - Analytics integration
- **Vercel Speed Insights** - Performance monitoring

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ArunimGuchait/chronos_vercel.git
cd chronos_vercel
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Creating a Workspace

1. On the landing page, enter a workspace name in the "New Workspace" field
2. Click the plus button or press Enter to create the workspace
3. Select a workspace to start tracking tasks

### Tracking a Task

1. Enter a task name in the "Current Objective" field
2. (Optional) Add tags by typing in the "Categories / Tags" field and pressing Enter
3. Click "START TRACKING" to begin the timer
4. Click "STOP TRACKING" when finished

### Viewing History

- Click the "History" tab to view all completed tasks
- See a 7-day productivity chart showing your daily focus time
- View task details including duration, tags, and timestamps

### Exporting Data

1. Navigate to the History view
2. Click "EXPORT CSV" to download the current month's tasks as a CSV file
3. The file will be named `tasks_[workspace]_[YYYY-MM].csv`

### Managing Workspaces

- Access workspace management from the main interface
- Switch between workspaces
- Delete workspaces (data will be permanently removed)

## Project Structure

```
chronos_vercel/
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── index.html           # HTML template
├── types.ts             # TypeScript type definitions
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
└── services/
    └── storageService.ts # Local storage management and CSV utilities
```

## Data Storage

All data is stored in the browser's `localStorage`:
- Workspace list: `chronos_workspaces`
- Workspace data: `chronos_ws_[workspace_name]`

Each workspace stores:
- Active task (if running)
- Task history
- Last exported month

## Deployment

This project is configured for deployment on Vercel. The build script (`vite build`) will automatically be used during deployment.

### Vercel Deployment

1. Push your code to GitHub
2. Import the repository in Vercel
3. Vercel will automatically detect the Vite configuration and build the project

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Thanks for your contributions to Chronos Task Tracker! Here's how you can help:

### Ways to Contribute

- **Report Bugs**: Found a bug? Open an issue describing the problem and steps to reproduce it
- **Suggest Features**: Have an idea? Share it by opening an issue with the "feature request" label
- **Submit Code**: Fix bugs, add features, or improve documentation via pull requests
- **Improve Documentation**: Help make the README, code comments, or inline docs better
- **Test**: Test the application and report any issues you find

### Getting Started with Code Contributions

1. **Fork the repository** and clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/chronos_vercel.git
   cd chronos_vercel
   ```

2. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**:
   - Follow the existing code style
   - Write clear, descriptive commit messages
   - Test your changes locally
   - Ensure TypeScript types are correct

4. **Test your changes**:
   ```bash
   npm run dev    # Test in development
   npm run build  # Ensure build succeeds
   ```

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "Description of your changes"
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**:
   - Provide a clear description of your changes
   - Reference any related issues
   - Include screenshots if UI changes are involved

### Code Style Guidelines

- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Maintain consistent formatting (the project uses standard formatting)
- Add comments for complex logic
- Keep components focused and modular
- Write self-documenting code with clear variable names

### Areas That Need Help

- Performance optimizations
- Additional export formats (JSON, PDF, etc.)
- Enhanced statistics and analytics
- UI/UX improvements
- Mobile experience enhancements
- Accessibility improvements
- Unit and integration tests
- Documentation improvements

Thank you for contributing to Chronos Task Tracker! 🎉

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) file for details.


---

Built with ❤️ using React, TypeScript, and Vite

