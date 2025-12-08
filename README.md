[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&pause=1000&width=435&lines=ChatForge;Multi-Model+AI+Chat+Platform)](https://git.io/typing-svg)

A powerful Flask-based AI chat platform with access to 100+ AI models from leading providers. Built with modern UI/UX, comprehensive features, and a complete payment gateway system for seamless AI conversations.

![ChatForge](static/images/logo.png)

## ✨ Features

### 🤖 Multi-Model AI Support (100+ Models)
- **OpenAI (25 models)**: GPT-5.1, GPT-5, GPT-4o, O1, O3, O4-mini, and more
- **Claude (6 models)**: Sonnet 4/4.5, Opus 4/4.1/4.5, Haiku 4.5
- **DeepSeek (23 models)**: DeepSeek R1, V3.2, Chat, Prover V2, distilled models
- **Google Gemini (7 models)**: Gemini 3 Pro, 2.5 Pro/Flash, 2.0 Flash
- **Google Gemma (12 models)**: Gemma 3 (27B, 12B, 4B), Gemma 2
- **Grok (11 models)**: Grok 4, Grok 3, Grok Vision, Grok Code

### 💬 Chat Management
- **Auto-Save History**: All conversations automatically saved with intelligent titles
- **Smart Title Generation**: Automatically creates meaningful 3-7 word titles from first prompt
- **Session Management**: Organize chats with custom titles
- **Edit & Delete**: Rename or remove chat sessions
- **Message Limits**: 20 messages per chat for free users (warning at 15)
- **Resume Conversations**: Continue from where you left off

### 🎨 Personalization
- **Nickname Support**: AI addresses you by your preferred name in responses
- **Custom System Prompts**: Define AI behavior and response style
- **Prompt Optimization**: AI-powered prompt enhancement
- **Persistent Settings**: Saved across all sessions and devices

### 💳 Credit & Subscription System
- **Guest Users**: 10 free credits (no signup required)
  - Access to 2-3 models per provider (12 models total)
- **Free Users**: 100 credits daily (auto-reset every 24 hours)
  - Access to 13 popular models
- **Pro Users**: 1000-12000 credits based on plan
  - Access to all 100+ models
  - Unlimited messages per chat
  - Priority support

### 💰 Payment Gateway
- **Multiple Payment Methods**: Card, UPI, Net Banking, Wallets
- **Flexible Plans**: Monthly ($19), Quarterly ($24.99), Yearly ($99)
- **Secure Processing**: 3-5 second animated processing with SSL encryption
- **Real-time Updates**: Credits and plan update immediately after payment
- **Fake Payment System**: Demo payment gateway (no real transactions)

### 🔐 Authentication & Security
- **User Registration**: Email-based signup with password hashing (Werkzeug)
- **Secure Login**: Session-based authentication
- **Welcome Modals**: Different greetings for signup vs signin
- **Password Toggle**: Show/hide password in auth forms
- **Data Privacy**: All conversations stored locally in SQLite

### 🎨 Modern UI/UX
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **Collapsible Sidebar**: 60px collapsed, 260px expanded
- **Responsive Design**: Mobile-friendly interface
- **Clean Input Box**: Three-section layout (header, input, footer)
- **Provider/Model Selectors**: Easy dropdown selection with badges
- **Scroll to Bottom**: Auto-scroll with manual button
- **Copy Messages**: One-click copy for bot responses
- **Code Blocks**: Syntax highlighting with copy button
- **Model Organization**: Free models on top, Pro models below with divider

### 📄 Additional Pages
- **Documentation**: Complete user guide with Puter.com setup instructions
- **Privacy Policy**: Scrollable privacy information
- **Upgrade Plans**: Pricing tiers and features comparison
- **Payment Gateway**: Modern checkout experience
- **Settings Modal**: Personalization, privacy, and upgrade options

### 🚀 Quick Start Prompts
- Quantum Computing
- Code Helper
- Writing Tips
- Data Analysis
- Machine Learning
- Math Helper

### ⚙️ Technical Features
- **Powered by Puter.com**: Requires Puter.com account for AI access
- **Real-time Typing**: Animated bot responses with markdown support
- **Message Count Tracking**: Per-session message limits
- **Session Persistence**: Resume conversations anytime
- **Error Handling**: Graceful error messages and recovery
- **Confetti Animations**: Celebration effects on successful actions

## 🚀 Installation

### Prerequisites
1. **Python 3.8+** installed on your system
2. **Puter.com Account**: Visit [puter.com](https://puter.com) and create a free account

### Setup Steps

1. **Clone the Repository**
```bash
git clone https://github.com/NikunjBaldaniya/ChatForge.git
cd "ChatForge"
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Run the Application**
```bash
python app.py
```

4. **Open Browser**
```
http://localhost:5000
```

## 📖 Usage

### Prerequisites
1. **Create Puter.com Account**: Visit [puter.com](https://puter.com) and sign up
2. **Verify Email**: Check your email and verify your Puter account
3. **Stay Logged In**: Keep Puter.com session active in your browser

### Getting Started
1. **Sign Up**: Create your ChatForge account for 100 daily credits
2. **Choose Provider**: Click provider button to select (OpenAI, Claude, DeepSeek, etc.)
3. **Select Model**: Click model button to choose specific AI model
4. **Start Chatting**: Type your message and press Enter
5. **Manage History**: Access saved chats from sidebar

### Personalization
1. Open Settings (gear icon in sidebar)
2. Go to Personalization tab
3. Set your nickname (AI will use it in responses)
4. Add custom system prompt (define AI behavior)
5. Click Save to apply settings

### Upgrading to Pro
1. Click "Upgrade" in user dropdown or sidebar
2. Select your plan (Monthly/Quarterly/Yearly)
3. Choose payment method (Card/UPI/Net Banking/Wallet)
4. Fill in payment details (fake payment system)
5. Complete payment and enjoy Pro features

### Keyboard Shortcuts
- **Enter**: Send message
- **Shift + Enter**: New line in message

## 🗂️ Project Structure

```
ChatForge/
├── app.py                 # Flask application with routes & logic
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   ├── index.html        # Main chat interface
│   ├── login.html        # Sign in page
│   ├── signup.html       # Sign up page
│   ├── docs.html         # Documentation page
│   ├── privacy.html      # Privacy policy
│   ├── payment.html      # Payment gateway
│   └── upgrade.html      # Pricing plans
├── static/
│   ├── css/
│   │   └── style.css     # Complete styling
│   ├── js/
│   │   ├── app.js        # Chat logic & UI
│   │   └── chat.js       # Additional chat functions
│   ├── images/
│   │   └── logo.png      # ChatForge logo
│   ├── favicon.ico       # Browser favicon
│   └── uploads/          # User file uploads
├── instance/
│   └── aiforge.db        # SQLite database
└── screenshorts/         # Application screenshots
```

## 🎯 API Endpoints

### Pages
- `GET /` - Main chat application
- `GET /login` - Sign in page
- `GET /signup` - Sign up page
- `GET /docs` - Documentation
- `GET /privacy` - Privacy policy
- `GET /upgrade` - Upgrade plans
- `GET /payment` - Payment gateway

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/credits` - Get user credits and subscription info

### Chat
- `POST /api/chat` - Send chat message
- `POST /api/save-message` - Save message to history
- `GET /api/chat-sessions` - Get user's chat sessions
- `GET /api/load-session/<id>` - Load specific chat
- `POST /api/generate-title` - Generate intelligent chat title
- `POST /api/update-title` - Update chat title
- `POST /api/delete-session` - Delete chat session

### Personalization
- `GET /api/personalization` - Get user settings
- `POST /api/personalization` - Save user settings
- `POST /api/optimize-prompt` - Optimize system prompt

### Payment & Subscription
- `POST /api/upgrade-pro` - Upgrade user to Pro plan
- `POST /api/upload` - Upload file

## 🔧 Configuration

### Database Models
- **User**: Authentication, credits, subscription, subscription_plan, subscription_expiry
- **ChatSession**: Chat metadata, message count, intelligent titles
- **ChatHistory**: Individual messages with role and content
- **UserSettings**: Nickname, system prompts, optimized prompts

### Credit System
- **Guest**: 10 credits (no reset)
- **Free**: 100 credits (daily reset)
- **Pro Monthly**: 1000 credits (daily reset)
- **Pro Quarterly**: 3000 credits (daily reset)
- **Business Yearly**: 12000 credits (daily reset)

### Subscription Plans
- **Free**: $0/month - 100 credits daily, 13 models
- **Pro Monthly**: $19/month - 1000 credits daily, all models
- **Pro Quarterly**: $24.99/3 months - 3000 credits daily, all models
- **Business Yearly**: $99/year - 12000 credits daily, all models

### Customization
Edit `app.py` to customize:
- Secret key (line 10)
- Database URI (line 11)
- Credit amounts (User model & check_daily_reset function)
- Message limits (app.js - line with currentMessageCount)
- Model restrictions (app.js - GUEST_MODELS, FREE_MODELS)

## 🌟 Technologies

### Backend
- **Flask**: Web framework
- **SQLAlchemy**: Database ORM
- **Werkzeug**: Password hashing & security
- **Python 3.8+**: Core language

### Frontend
- **Bootstrap 5**: UI framework
- **Font Awesome**: Icons
- **Marked.js**: Markdown rendering
- **Puter.js AI SDK**: AI model access
- **Canvas Confetti**: Celebration animations

### Database
- **SQLite**: Local database storage

## 🎯 Key Highlights

- ✅ 100+ AI models from 6 major providers
- ✅ Intelligent chat title generation (3-7 words)
- ✅ Complete payment gateway with multiple methods
- ✅ Real-time credit and plan updates
- ✅ Personalized AI responses with nickname
- ✅ Dark/light theme support
- ✅ Mobile-responsive design
- ✅ Session-based authentication
- ✅ Auto-save conversations
- ✅ Message limit warnings
- ✅ Model access restrictions (Guest/Free/Pro)
- ✅ Comprehensive documentation
- ✅ Fake payment system for demo

## 📞 Support

For issues or questions:
- Check `/docs` for complete documentation
- Review `/privacy` for data policies
- Visit `/upgrade` for premium features

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## ⚠️ Important Notes

1. **Puter.com Account Required**: You must have an active Puter.com account to use AI features
2. **Browser Session**: Keep Puter.com logged in while using ChatForge
3. **Credit Reset**: User credits reset every 24 hours based on subscription
4. **Message Limits**: Free users limited to 20 messages per chat session
5. **Data Privacy**: All conversations stored locally in SQLite database
6. **Fake Payment**: Payment gateway is for demonstration only - no real transactions
7. **Model Access**: Different tiers have access to different model sets
8. **Title Generation**: Chat titles auto-generated from first meaningful prompt

## 🎨 Screenshots

Screenshots available in `/screenshorts` directory:
- Home page with examples
- Login/Signup pages
- Settings and optimization
- Payment gateway
- Upgrade plans
- Welcome modals

## 🚀 Future Enhancements

- Real payment gateway integration
- Team collaboration features
- API key management
- Custom model fine-tuning
- Advanced analytics dashboard
- Mobile app (iOS/Android)
- Voice input/output
- Image generation support
- Multi-language support

---

**Built with ❤️ for AI enthusiasts**

**Version**: 1.0.0  
**Last Updated**: 2024
