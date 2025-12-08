from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import uuid
import os
import base64

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///aiforge.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    credits = db.Column(db.Integer, default=100)
    subscription = db.Column(db.String(20), default='free')
    subscription_plan = db.Column(db.String(50), default='Free Plan')
    subscription_expiry = db.Column(db.DateTime, nullable=True)
    last_credit_reset = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    session_id = db.Column(db.String(100), unique=True)
    title = db.Column(db.String(200), default='New Chat')
    message_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), db.ForeignKey('chat_session.session_id'))
    role = db.Column(db.String(20))
    content = db.Column(db.Text)
    model = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class UserSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True)
    nickname = db.Column(db.String(100))
    system_prompt = db.Column(db.Text)
    optimized_prompt = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    if 'guest_id' not in session:
        session['guest_id'] = str(uuid.uuid4())
        session['guest_credits'] = 10
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/signup')
def signup_page():
    return render_template('signup.html')

@app.route('/privacy')
def privacy_page():
    return render_template('privacy.html')

@app.route('/upgrade')
def upgrade_page():
    return render_template('upgrade.html')

@app.route('/docs')
def docs_page():
    return render_template('docs.html')

@app.route('/payment')
def payment_page():
    return render_template('payment.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Email already exists'})
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'success': False, 'message': 'Username already exists'})
    
    user = User(
        username=data['username'],
        email=data['email'],
        password=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()
    
    session.clear()
    session['user_id'] = user.id
    session['welcome_type'] = 'signup'
    
    return jsonify({
        'success': True, 
        'credits': user.credits, 
        'username': user.username, 
        'welcome_type': 'signup'
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password, data['password']):
        session.clear()
        session['user_id'] = user.id
        session['welcome_type'] = 'signin'
        check_daily_reset(user)
        return jsonify({
            'success': True, 
            'credits': user.credits, 
            'username': user.username, 
            'welcome_type': 'signin'
        })
    
    return jsonify({'success': False, 'message': 'Invalid email or password'})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True})

@app.route('/api/credits')
def get_credits():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        check_daily_reset(user)
        welcome_type = session.pop('welcome_type', None)
        expiry_date = user.subscription_expiry.isoformat() if user.subscription_expiry else None
        return jsonify({
            'credits': user.credits, 
            'logged_in': True, 
            'welcome_type': welcome_type, 
            'subscription': user.subscription, 
            'subscription_plan': user.subscription_plan,
            'subscription_expiry': expiry_date,
            'username': user.username
        })
    return jsonify({'credits': session.get('guest_credits', 10), 'logged_in': False, 'welcome_type': None, 'subscription': 'guest', 'subscription_plan': 'Guest'})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user.credits < 1:
            return jsonify({'success': False, 'message': 'Insufficient credits'})
        user.credits -= 1
        db.session.commit()
    else:
        if session.get('guest_credits', 0) < 1:
            return jsonify({'success': False, 'message': 'Insufficient credits. Please sign up.'})
        session['guest_credits'] -= 1
    
    return jsonify({'success': True})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'})
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        with open(filepath, 'rb') as f:
            file_data = base64.b64encode(f.read()).decode('utf-8')
        
        return jsonify({'success': True, 'filename': filename, 'data': file_data})
    
    return jsonify({'success': False, 'message': 'Upload failed'})

@app.route('/api/chat-sessions')
def get_chat_sessions():
    if 'user_id' not in session:
        return jsonify({'success': False, 'sessions': []})
    
    user_id = session['user_id']
    sessions = ChatSession.query.filter_by(user_id=user_id).order_by(ChatSession.updated_at.desc()).all()
    
    return jsonify({
        'success': True,
        'sessions': [{'id': s.id, 'session_id': s.session_id, 'title': s.title, 'message_count': s.message_count, 'updated_at': s.updated_at.isoformat()} for s in sessions]
    })

@app.route('/api/generate-title', methods=['POST'])
def generate_title():
    if 'user_id' not in session:
        return jsonify({'success': False})
    
    data = request.get_json()
    first_user_input = data.get('first_user_input', '').strip()
    session_id = data.get('session_id')
    
    if not first_user_input:
        return jsonify({'success': False})
    
    # Generate intelligent title
    title = generate_smart_title(first_user_input)
    
    chat_session = ChatSession.query.filter_by(session_id=session_id).first()
    if chat_session:
        chat_session.title = title
        chat_session.updated_at = datetime.utcnow()
        db.session.commit()
    
    return jsonify({'success': True, 'title': title})

def generate_smart_title(prompt):
    # Short/generic prompts - use fallback
    short_prompts = ['hi', 'hello', 'hey', 'test', 'testing', 'ok', 'okay', 'yes', 'no']
    if len(prompt.split()) <= 2 and prompt.lower() in short_prompts:
        return 'New Chat'
    
    # Remove common question words and clean
    words = prompt.split()
    
    # If starts with question words, keep the important part
    question_starters = ['how', 'what', 'why', 'when', 'where', 'who', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does']
    
    # Create title (3-7 words)
    if len(words) <= 7:
        title = prompt
    else:
        # Take first 6 words for longer prompts
        title = ' '.join(words[:6])
    
    # Capitalize first letter
    title = title[0].upper() + title[1:] if title else 'New Chat'
    
    # Limit to 50 characters
    if len(title) > 50:
        title = title[:47] + '...'
    
    return title

@app.route('/api/update-title', methods=['POST'])
def update_title():
    if 'user_id' not in session:
        return jsonify({'success': False})
    
    data = request.get_json()
    session_id = data.get('session_id')
    title = data.get('title', '').strip()
    user_id = session['user_id']
    
    if not title:
        return jsonify({'success': False, 'message': 'Title cannot be empty'})
    
    chat_session = ChatSession.query.filter_by(session_id=session_id, user_id=user_id).first()
    if chat_session:
        chat_session.title = title
        chat_session.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'message': 'Session not found'})

@app.route('/api/load-session/<session_id>')
def load_session(session_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    user_id = session['user_id']
    chat_session = ChatSession.query.filter_by(session_id=session_id, user_id=user_id).first()
    
    if not chat_session:
        return jsonify({'success': False, 'message': 'Session not found'})
    
    messages = ChatHistory.query.filter_by(session_id=session_id).order_by(ChatHistory.timestamp).all()
    
    return jsonify({
        'success': True,
        'message_count': chat_session.message_count,
        'messages': [{'role': m.role, 'content': m.content, 'model': m.model} for m in messages]
    })

@app.route('/api/save-message', methods=['POST'])
def save_message():
    if 'user_id' not in session:
        return jsonify({'success': False})
    
    data = request.get_json()
    session_id = data.get('session_id')
    role = data.get('role')
    user_id = session['user_id']
    
    # Ensure chat session exists
    chat_session = ChatSession.query.filter_by(session_id=session_id).first()
    if not chat_session:
        chat_session = ChatSession(
            user_id=user_id,
            session_id=session_id,
            title='New Chat',
            message_count=0
        )
        db.session.add(chat_session)
    
    # Save message
    message = ChatHistory(
        session_id=session_id,
        role=role,
        content=data.get('content'),
        model=data.get('model', '')
    )
    db.session.add(message)
    
    # Update session
    if role == 'user':
        chat_session.message_count += 1
    chat_session.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/personalization', methods=['GET', 'POST'])
def personalization():
    if 'user_id' not in session:
        return jsonify({'success': False})
    
    user_id = session['user_id']
    
    if request.method == 'GET':
        settings = UserSettings.query.filter_by(user_id=user_id).first()
        if settings:
            return jsonify({
                'success': True,
                'nickname': settings.nickname,
                'system_prompt': settings.system_prompt,
                'optimized_prompt': settings.optimized_prompt
            })
        return jsonify({'success': True, 'nickname': '', 'system_prompt': '', 'optimized_prompt': ''})
    
    data = request.get_json()
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)
    
    settings.nickname = data.get('nickname', '')
    settings.system_prompt = data.get('system_prompt', '')
    settings.optimized_prompt = data.get('optimized_prompt', '')
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/optimize-prompt', methods=['POST'])
def optimize_prompt():
    data = request.get_json()
    nickname = data.get('nickname', '')
    system_prompt = data.get('system_prompt', '')
    
    optimized = f"You are an AI assistant. The user prefers to be called {nickname}. {system_prompt}"
    
    return jsonify({'success': True, 'optimized_prompt': optimized})

@app.route('/api/delete-session', methods=['POST'])
def delete_session():
    if 'user_id' not in session:
        return jsonify({'success': False})
    
    data = request.get_json()
    session_id = data.get('session_id')
    user_id = session['user_id']
    
    # Verify ownership
    chat_session = ChatSession.query.filter_by(session_id=session_id, user_id=user_id).first()
    if not chat_session:
        return jsonify({'success': False, 'message': 'Session not found'})
    
    ChatHistory.query.filter_by(session_id=session_id).delete()
    ChatSession.query.filter_by(session_id=session_id).delete()
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/upgrade-pro', methods=['POST'])
def upgrade_pro():
    if 'user_id' not in session:
        return jsonify({'success': False})
    
    data = request.get_json()
    plan = data.get('plan', 'monthly')
    days = data.get('days', 30)
    amount = data.get('amount', 0)
    
    user = User.query.get(session['user_id'])
    if user:
        user.subscription = 'pro'
        
        # Set plan name and credits based on plan type
        if plan == 'monthly':
            user.subscription_plan = 'Pro Monthly'
            user.credits = 1000
        elif plan == 'quarterly':
            user.subscription_plan = 'Pro Quarterly'
            user.credits = 3000
        elif plan == 'yearly':
            user.subscription_plan = 'Business Yearly'
            user.credits = 12000
        else:
            user.subscription_plan = 'Pro Plan'
            user.credits = 1000
        
        user.subscription_expiry = datetime.utcnow() + timedelta(days=days)
        user.last_credit_reset = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'credits': user.credits,
            'subscription': user.subscription,
            'subscription_plan': user.subscription_plan,
            'expiry': user.subscription_expiry.isoformat()
        })
    
    return jsonify({'success': False})

def check_daily_reset(user):
    if datetime.utcnow() - user.last_credit_reset > timedelta(days=1):
        # Reset credits based on subscription
        if user.subscription == 'pro':
            if 'Monthly' in user.subscription_plan:
                user.credits = 1000
            elif 'Quarterly' in user.subscription_plan:
                user.credits = 3000
            elif 'Yearly' in user.subscription_plan or 'Business' in user.subscription_plan:
                user.credits = 12000
            else:
                user.credits = 1000
        else:
            user.credits = 100
        user.last_credit_reset = datetime.utcnow()
        db.session.commit()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
