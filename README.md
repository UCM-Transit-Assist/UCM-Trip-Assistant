# 😼🚌 UCM Trip Assistant

An intelligent trip planning assistant for UC Merced students that helps you find the best CatTracks routes from campus to your destination, and plan your bus routes using AI-powered location search and real-time bus schedules.

## 🌟 Features

- **AI-Powered Location Search**: Ask natural language questions like "Where are good coffee shops nearby?" and get personalized recommendations
- **Bus Route Planning**: Automatically finds the nearest bus stop to your destination and provides step-by-step directions
- **Interactive Maps**: Visual representation of bus routes, walking paths, and destinations with Google Maps integration
- **Time-Based Scheduling**: Specify your desired arrival time and get exact bus departure times from UTC
- **Multiple Bus Routes**: Support for 9 different bus routes (C1, C2, E1, E2, FastCat, BE, G, Yosemite)
- **Real-Time Bus Schedules**: Access to complete bus timetables for all routes during Fall 2025 semester
- **Walking Directions**: Calculates walking distance and time from bus stops to destinations

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.0.1 (App Router)
- **UI Library**: React 19.2.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Maps**: React Google Maps API, Google Maps Embed API
- **Markdown**: ReactMarkdown

### Backend/AI
- **AI Model**: Google Gemini 2.5 Flash
- **Maps Integration**: Google Maps Geocoding API, Directions API, Distance Matrix API
- **Maps Grounding**: Gemini Maps Grounding for location extraction

## 📋 Prerequisites

- Node.js 18+ (recommended for Next.js 16)
- npm, yarn, pnpm, or bun
- Google Gemini API Key
- Google Maps API Key

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd UCM-Trip-Assistant
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
```

**Getting API Keys:**
- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Google Maps API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/)
  - Enable the following APIs:
    - Maps JavaScript API
    - Geocoding API
    - Directions API
    - Distance Matrix API
    - Maps Embed API

### 4. Run the Development Server

```bash
npm run dev
```

### 5. Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Basic Usage

1. **Select a Bus Route**: Use the dropdown in the header to select your desired bus route
2. **Ask a Question**: Type a natural language question in the chat, such as:
   - "What are good coffee shops near UC Merced?"
   - "Show me restaurants nearby"
   - "Where can I find grocery stores?"

### Time-Based Planning

Specify your desired arrival time in your query:

- "I need to be at Chipotle by 3:00 PM"
- "What time should I leave to get to Walmart at 2pm?"
- "Show me coffee shops, I want to arrive by 10:30 AM"

The assistant will:
- Find the nearest bus stop to your destination
- Calculate the optimal bus trip based on your arrival time
- Tell you exactly when to board at UTC
- Provide total travel time including walking

### Example Queries

- "Where are good coffee shops nearby?"
- "I need to get to Target by 5:00 PM"
- "Show me restaurants near campus"
- "What's the best way to get to the mall at 2pm?"

## 🗺️ Supported Bus Routes

- **Bobcat Express** - (Monday - Friday)
- **C1** - UTC South (Monday - Friday)
- **C2** - UTC South (Monday - Friday)
- **FastCat** - UTC North (Monday - Friday)
- **FastCat 2** - UTC North (Monday - Friday)
- **G-Line** - UTC South (Mon - Fri)
- **Yosemite Express** - UTC North (Mon - Fri)
- - **E1** - UTC South (Saturday - Sunday)
- **E2** - UTC South (Saturday - Sunday)
