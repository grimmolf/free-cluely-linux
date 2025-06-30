# Free Cluely

A desktop application to help you cheat on everything.

## ✨ Key Features

- **Multi-Monitor Support**: Select which monitor to capture screenshots from in dual/triple monitor setups
- **Multi-Provider AI**: Choose from Gemini, Red Hat Model as a Service, or Ollama (local)
- **Cross-Platform**: Works on Windows, macOS, and Linux (with enhanced Linux support)
- **Keyboard Shortcuts**: Quick screenshot capture and window management
- **Persistent Settings**: Monitor preferences and AI configuration saved between sessions

## 🚀 Quick Start Guide

### Prerequisites
- Make sure you have Node.js installed on your computer
- Git installed on your computer
- **Choose one AI model provider:**
  - **Google Gemini** (Recommended): Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
  - **Red Hat Model as a Service**: Get API key from [Red Hat Developer Portal](https://developers.redhat.com/)
  - **Ollama** (Local/Free): Install [Ollama](https://ollama.ai) locally - no API key required

#### Linux Fedora Additional Requirements
For optimal performance on Linux Fedora, ensure you have:
- **`imagemagick` (REQUIRED for multi-monitor support)**: `sudo dnf install imagemagick`
- `gnome-screenshot` (optional fallback for single monitor)
- X11 or Wayland display server properly configured
- Required development tools: `sudo dnf install gcc-c++ make python3-devel`

**Note**: ImageMagick is essential for the multi-monitor screenshot feature. Without it, monitor selection will not work properly.

### Installation Steps

1. Clone the repository:
```bash
git clone [repository-url]
cd free-cluely-linux
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy the example environment file: `cp .env.example .env`
   - Edit the `.env` file and add your chosen provider's API key:
   ```bash
   # For Google Gemini (default)
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # For Red Hat Model as a Service
   REDHAT_API_KEY=your_redhat_api_key_here
   
   # For Ollama (no API key needed, just install Ollama)
   ```
   - Save the file

### Running the App

#### Method 1: Development Mode (Recommended for first run)
1. Open a terminal and run:
```bash
npm run dev -- --port 5180
```

2. Open another terminal in the same folder and run:
```bash
NODE_ENV=development npm run electron:dev
```

#### Method 2: Production Mode
```bash
npm run build
```
The built app will be in the `release` folder.

### ⚙️ Configuration

Once the app is running, you can configure various settings:

#### Model Provider Configuration

1. **Access Settings**: Click the ⚙️ Settings button in the main interface
2. **Choose Provider**: Select from Gemini, Red Hat Model as a Service, or Ollama
3. **Configure Model**: Choose your preferred model (e.g., gemini-2.0-flash, llama3.1, etc.)
4. **Add API Key**: Enter your API key if required (not needed for Ollama)
5. **Save**: Click Save Configuration to apply changes

#### Screenshot Settings (Multi-Monitor Support)

**NEW**: Enhanced multi-monitor support for dual/triple monitor setups!

For users with multiple monitors:

1. **Access Settings**: Click the ⚙️ Settings button
2. **Screenshot Settings**: Find the Screenshot Settings section
3. **Select Monitor**: Choose which monitor to capture screenshots from:
   - **"All Monitors (Default)"** - Captures from all monitors combined
   - **Individual monitor selection** - Captures only from the selected monitor (e.g., "Display 1 (1920x1080)")
4. **Save**: Click Save Settings to apply changes

**Key Benefits:**
- Capture screenshots from your active work monitor only
- Avoid capturing sensitive information from secondary monitors
- Better performance with focused screen capture
- Works with dual-monitor, triple-monitor, and extended display setups

**Technical Implementation:**
- Uses ImageMagick on Linux for reliable multi-monitor support
- Falls back to Electron's native screenshot API if needed
- Automatic display detection and enumeration

#### Provider-Specific Setup:

**Ollama (Local/Free)**:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model (example: Llama 3.1)
ollama pull llama3.1

# Start Ollama (usually runs automatically)
ollama serve
```

**Red Hat Model as a Service**:
- Sign up at [Red Hat Developer Portal](https://developers.redhat.com/)
- Navigate to AI/ML services 
- Generate an API key
- Supports models like Llama 3.1, Mistral, and Phi-3

### ⚠️ Important Notes

1. **Closing the App**: 
   - Press `Cmd + Q` (Mac) or `Ctrl + Q` (Windows/Linux) to quit
   - Or use Activity Monitor/Task Manager to close `Interview Coder`
   - The X button currently doesn't work (known issue)

2. **If the app doesn't start**:
   - Make sure no other app is using port 5180
   - Try killing existing processes:
     ```bash
     # Find processes using port 5180
     lsof -i :5180
     # Kill them (replace [PID] with the process ID)
     kill [PID]
     ```

   **Linux Fedora specific troubleshooting**:
   - If screenshots aren't working, install required tools:
     ```bash
     # REQUIRED: For multi-monitor support
     sudo dnf install imagemagick
     
     # Optional fallbacks (only if ImageMagick fails):
     # For GNOME desktop environments
     sudo dnf install gnome-screenshot
     ```
   - If the window doesn't show properly, try:
     ```bash
     # Set X11 permissions (if using X11)
     xhost +local:
     # Or ensure proper Wayland permissions
     ```

   **Multi-Monitor Issues**:
   - **FIRST STEP**: Ensure ImageMagick is properly installed:
     ```bash
     # Install ImageMagick (essential for multi-monitor support)
     sudo dnf install imagemagick
     # Verify installation and display detection
     identify -list display
     ```
   - If monitor selection still isn't working:
     - **Restart the application completely** after installing ImageMagick
     - Check the app logs for "Screenshot error" or "Falling back to Electron" messages
     - Try selecting a specific monitor in Settings instead of "All Monitors"
   - If screenshots only capture the primary monitor:
     - Verify ImageMagick installation: `which convert` (should return a path)
     - Check Settings → Screenshot Settings → Select your desired monitor
     - The app will automatically fall back to Electron's native capture if ImageMagick fails
   - If no monitors appear in the settings dropdown:
     - Run in development mode to see detailed logs: `NODE_ENV=development npm run electron:dev`
     - Check console for "Electron displays:" and "Screenshot-desktop displays:" logs

3. **Keyboard Shortcuts**:
   - `Cmd/Ctrl + B`: Toggle window visibility
   - `Cmd/Ctrl + H`: Take screenshot
   - 'Cmd/Enter': Get solution
   - `Cmd/Ctrl + Arrow Keys`: Move window

### Troubleshooting

If you see errors:
1. Delete the `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again
4. Try running the app again using Method 1

## Contribution

I'm unable to maintain this repo actively because I do not have the time for it. Please do not create issues, if you have any PRs feel free to create them and i'll review and merge it.

If you are looking to integrate this for your company, i can work with you to create custom solutions. 
