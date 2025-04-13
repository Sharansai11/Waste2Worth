# Waste2Worth

**Turning Waste into Worth: Building the Uber for Waste Management in India**

Waste2Worth is an innovative, AI-powered waste management platform designed to tackle India’s growing waste challenges head-on. By digitally connecting citizens, volunteers, recyclers, and NGOs, our platform transforms waste into valuable resources—paving the way for a cleaner, greener, and more sustainable future.

---

## Why Waste2Worth?

Every day, India generates more than **160,000 tons of waste**. Much of this waste ends up in landfills, rivers, or is burned openly, harming public health and the environment. Even if only **30%** of that waste were recycled, it could unlock an economic opportunity of **₹18,000 crore** annually!  
Current waste management practices are largely manual, fragmented, and lack proper traceability. Waste2Worth changes the game by leveraging smart technology and real-time data to ensure efficient, secure waste collection, effective upcycling, and safe disposal.

---

## What We Offer

### For Waste Contributors:
- **AI-Powered Waste Segregation:**  
  Upload an image of your waste, and our Gemini API classifies it into categories—plastic, e-waste, biodegradable, etc.—streamlining the recycling process.

- **Secure, OTP-Verified Collections:**  
  Our one-time password (OTP) system verifies every pickup, ensuring authenticity and traceability.

- **Optimized Routing:**  
  Volunteers benefit from Google Maps-powered routing that connects multiple locations, saving both time and fuel.

- **Instant Communication:**  
  Real-time chat keeps waste contributors and collectors in seamless contact.

- **Upcycling & Safe Disposal Guidance:**  
  Access expert guidance on eco-friendly upcycling methods and safe disposal practices to maximize the value recovered from your waste.

- **Multilingual Access (via Google Translate Script):**  
  The platform supports multiple languages by embedding Google Translate using script injection for a more inclusive user experience.

### For Volunteers:
- **Impact Dashboard:**  
  Track your achievements—from CO₂ reduction and water saved to trees preserved—making every pickup count.

- **Rewards & Achievements:**  
  Earn badges and recognition for every verified collection, encouraging continuous community engagement.

### For NGOs & Recyclers:
- **Comprehensive Management:**  
  Manage volunteer teams via an intuitive dashboard that supports bulk Excel registration and real-time performance tracking.

- **Detailed Impact Analytics:**  
  Monitor environmental metrics and track progress towards Sustainable Development Goals (SDGs), including safe disposal statistics.

### Plus, a Little Extra:
- **Educational Content:**  
  Integrated YouTube API delivers eco-friendly upcycling tutorials and waste reduction videos right to your dashboard.

- **Lifecycle Tracking:**  
  Stay informed about your waste—from submission, through upcycling or safe disposal, to final recycling—with clear status updates.

---

## How It Works

1. **Easy Registration & Role-Based Onboarding:**  
   Users sign up as contributors, volunteers, recyclers, or NGOs, receiving a personalized dashboard that fits their role.

2. **Smart Waste Submission:**  
   Contributors upload images of their waste. The Gemini API classifies the waste type, simplifying the segregation process.

3. **Verified Waste Collection:**  
   Volunteers receive collection tasks and verify pickups using OTP authentication, ensuring secure and traceable waste handling.

4. **Efficient Routing & Real-Time Communication:**  
   Volunteers navigate optimized routes via Google Maps, and real-time chat enables smooth on-the-go coordination.

5. **Impact Monitoring:**  
   NGOs and recyclers track environmental metrics and volunteer performance on dynamic dashboards, while contributors see the collective impact.

6. **Upcycling & Safe Disposal Guidance:**  
   Beyond traditional recycling, our platform provides information and tips for upcycling waste into valuable products, as well as guidelines for safe disposal where recycling isn’t an option.

7. **Learning and Awareness:**  
   Benefit from integrated educational videos and resources that promote sustainable waste practices and waste reduction.

---

## Tech Stack & Technologies

- **Frontend:**  
  Vite + React.js for fast and efficient development, ensuring an optimized user experience.

- **Backend:**  
  Node.js with Firebase Cloud Functions for scalable, serverless logic.

- **Database:**  
  Firebase Firestore (NoSQL) for real-time data synchronization.

- **Hosting & Authentication:**  
  Firebase for secure hosting and built-in authentication solutions.

- **AI Waste Classification:**  
  Gemini API for smart, image-based waste segregation.

- **Maps & Routing:**  
  Google Maps API for efficient navigation.

- **Multilingual Support:**  
  Google Translate is integrated via a client-side script (`element.js`) for dynamic on-page translation without needing a dedicated API key.

- **Content Delivery:**  
  YouTube API for integrating educational video content.

- **Identity Management:**  
  (Optional) Project IDX for secure and decentralized identity management.

---

## Running Locally

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v12+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli) for managing functions and Firestore
- API keys for Google Maps, Gemini, and YouTube APIs
- (Optional) Project IDX credentials for identity management

### Installation Steps

1. **Clone the Repository**
    ```bash
    git clone https://github.com/Sharansai11/Waste2Worth.git
    cd Waste2Worth
    ```

2. **Install Dependencies**
    ```bash
    npm install
    ```
    or
    ```bash
    yarn install
    ```

3. **Firebase Setup**
    - Log in to Firebase:
      ```bash
      firebase login
      ```
    - Initialize the Firebase project:
      ```bash
      firebase init
      ```
    - Follow the prompts to set up Firestore, Functions, and Hosting.

4. **Configure Environment Variables**
    - Create a `.env` file in the root directory and include your API keys and Firebase configuration:
      ```dotenv
      VITE_FIREBASE_API_KEY=your_api_key
      VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
      VITE_FIREBASE_PROJECT_ID=your_project_id
      VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
      VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
      VITE_FIREBASE_APP_ID=your_app_id
      VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

      VITE_GEMINI_API_KEY=your_gemini_api_key
      VITE_YOUTUBE_API_KEY=your_youtube_api_key
      VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
      ```

5. **Launch the Application Locally**
    ```bash
    npm run dev
    ```
    or
    ```bash
    yarn dev
    ```
    The application will open at [http://localhost:3000](http://localhost:3000).

6. **Deploy (Optional)**
    To deploy the project on Firebase:
    ```bash
    firebase deploy
    ```

---


Waste2Worth isn’t just an application—it’s a movement to revolutionize waste management in India. By integrating cutting-edge technology with eco-conscious practices, we’re turning everyday waste into valuable opportunities. Join us in creating a cleaner, more sustainable future!
