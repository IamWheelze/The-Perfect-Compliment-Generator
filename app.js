// The Perfect Compliment Generator - Enhanced Edition
// Main application logic with advanced features

class ComplimentGenerator {
    constructor() {
        // Audio recording
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.timerInterval = null;
        this.timeRemaining = 30;
        this.recognition = null;
        this.transcript = '';

        // Audio visualization
        this.audioContext = null;
        this.analyser = null;
        this.visualizerAnimationId = null;

        // App state
        this.currentCompliment = null;
        this.currentStyle = 'profound';
        this.currentTheme = 'default';
        this.themes = ['default', 'sunset', 'ocean', 'forest', 'midnight'];
        this.history = [];
        this.totalComplimentsGenerated = 0;

        this.initElements();
        this.initEventListeners();
        this.loadSettings();
        this.loadHistory();
        this.initParticles();
        this.updateStats();
    }

    initElements() {
        // Main controls
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.timer = document.getElementById('timer');
        this.timerValue = document.getElementById('timerValue');
        this.timerBar = document.getElementById('timerBar');
        this.statusMessage = document.getElementById('statusMessage');

        // Content areas
        this.transcriptContainer = document.getElementById('transcriptContainer');
        this.transcriptEl = document.getElementById('transcript');
        this.sentimentContainer = document.getElementById('sentimentContainer');
        this.complimentContainer = document.getElementById('complimentContainer');
        this.complimentEl = document.getElementById('compliment');

        // Visualizer
        this.visualizerContainer = document.getElementById('visualizerContainer');
        this.visualizer = document.getElementById('visualizer');

        // Buttons
        this.copyBtn = document.getElementById('copyBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.resetBtn = document.getElementById('resetBtn');

        // Settings
        this.apiProvider = document.getElementById('apiProvider');
        this.apiKey = document.getElementById('apiKey');
        this.apiKeyGroup = document.getElementById('apiKeyGroup');
        this.recordingTime = document.getElementById('recordingTime');
        this.soundEffects = document.getElementById('soundEffects');
        this.autoSave = document.getElementById('autoSave');

        // Theme and history
        this.themeBtn = document.getElementById('themeBtn');
        this.historyBtn = document.getElementById('historyBtn');
        this.historyPanel = document.getElementById('historyPanel');
        this.closeHistoryBtn = document.getElementById('closeHistoryBtn');
        this.historyContent = document.getElementById('historyContent');

        // Share modal
        this.shareModal = document.getElementById('shareModal');
        this.closeShareModal = document.getElementById('closeShareModal');

        // Stats
        this.statsCompliments = document.getElementById('statsCompliments');

        // Footer links
        this.aboutLink = document.getElementById('aboutLink');
        this.exportDataLink = document.getElementById('exportDataLink');
        this.clearDataLink = document.getElementById('clearDataLink');

        // Sentiment
        this.positivityBar = document.getElementById('positivityBar');
        this.enthusiasmBar = document.getElementById('enthusiasmBar');
        this.depthBar = document.getElementById('depthBar');
        this.personalityTags = document.getElementById('personalityTags');
    }

    initEventListeners() {
        // Main controls
        this.startBtn.addEventListener('click', () => this.startListening());
        this.stopBtn.addEventListener('click', () => this.stopListening());

        // Compliment actions
        this.copyBtn.addEventListener('click', () => this.copyCompliment());
        this.shareBtn.addEventListener('click', () => this.openShareModal());
        this.saveBtn.addEventListener('click', () => this.saveCompliment());
        this.regenerateBtn.addEventListener('click', () => this.regenerateCompliment());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Settings
        this.apiProvider.addEventListener('change', () => this.handleProviderChange());
        this.apiKey.addEventListener('change', () => this.saveSettings());
        this.recordingTime.addEventListener('change', () => this.saveSettings());
        this.soundEffects.addEventListener('change', () => this.saveSettings());
        this.autoSave.addEventListener('change', () => this.saveSettings());

        // Theme and history
        this.themeBtn.addEventListener('click', () => this.cycleTheme());
        this.historyBtn.addEventListener('click', () => this.toggleHistory());
        this.closeHistoryBtn.addEventListener('click', () => this.toggleHistory());

        // Share modal
        this.closeShareModal.addEventListener('click', () => this.closeShareModalFn());
        document.querySelectorAll('.share-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleShare(e.currentTarget.dataset.platform));
        });

        // Style selector
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeStyle(e.currentTarget.dataset.style));
        });

        // Footer links
        this.aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAbout();
        });
        this.exportDataLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportData();
        });
        this.clearDataLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearHistory();
        });
    }

    // === PARTICLE SYSTEM ===
    initParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // === THEME MANAGEMENT ===
    cycleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.currentTheme = this.themes[nextIndex];

        if (this.currentTheme === 'default') {
            document.body.removeAttribute('data-theme');
        } else {
            document.body.setAttribute('data-theme', this.currentTheme);
        }

        localStorage.setItem('theme', this.currentTheme);
        this.playSound('click');
    }

    // === HISTORY MANAGEMENT ===
    toggleHistory() {
        this.historyPanel.classList.toggle('open');
        if (this.historyPanel.classList.contains('open')) {
            this.renderHistory();
        }
    }

    loadHistory() {
        const saved = localStorage.getItem('complimentHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.totalComplimentsGenerated = this.history.length;
        }
    }

    saveHistory() {
        localStorage.setItem('complimentHistory', JSON.stringify(this.history));
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyContent.innerHTML = '<p class="history-empty">No compliments saved yet. Start generating!</p>';
            return;
        }

        this.historyContent.innerHTML = this.history.map((item, index) => `
            <div class="history-item">
                <div class="history-item-header">
                    <span class="history-item-date">${new Date(item.date).toLocaleDateString()}</span>
                    <button class="history-item-delete" data-index="${index}">Delete</button>
                </div>
                <div class="history-item-text">${item.compliment}</div>
            </div>
        `).join('');

        // Add delete listeners
        document.querySelectorAll('.history-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.deleteHistoryItem(index);
            });
        });
    }

    deleteHistoryItem(index) {
        this.history.splice(index, 1);
        this.saveHistory();
        this.renderHistory();
        this.updateStats();
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            this.history = [];
            this.totalComplimentsGenerated = 0;
            this.saveHistory();
            this.updateStats();
            this.renderHistory();
            this.playSound('success');
        }
    }

    // === SETTINGS MANAGEMENT ===
    handleProviderChange() {
        const provider = this.apiProvider.value;
        if (provider === 'browser') {
            this.apiKeyGroup.style.display = 'none';
        } else {
            this.apiKeyGroup.style.display = 'block';
        }
        this.saveSettings();
    }

    saveSettings() {
        localStorage.setItem('apiProvider', this.apiProvider.value);
        localStorage.setItem('apiKey', this.apiKey.value);
        localStorage.setItem('recordingTime', this.recordingTime.value);
        localStorage.setItem('soundEffects', this.soundEffects.checked);
        localStorage.setItem('autoSave', this.autoSave.checked);
    }

    loadSettings() {
        const savedProvider = localStorage.getItem('apiProvider');
        const savedKey = localStorage.getItem('apiKey');
        const savedTime = localStorage.getItem('recordingTime');
        const savedSoundEffects = localStorage.getItem('soundEffects');
        const savedAutoSave = localStorage.getItem('autoSave');
        const savedTheme = localStorage.getItem('theme');

        if (savedProvider) {
            this.apiProvider.value = savedProvider;
            this.handleProviderChange();
        }

        if (savedKey) {
            this.apiKey.value = savedKey;
        }

        if (savedTime) {
            this.recordingTime.value = savedTime;
        }

        if (savedSoundEffects !== null) {
            this.soundEffects.checked = savedSoundEffects === 'true';
        }

        if (savedAutoSave !== null) {
            this.autoSave.checked = savedAutoSave === 'true';
        }

        if (savedTheme) {
            this.currentTheme = savedTheme;
            if (savedTheme !== 'default') {
                document.body.setAttribute('data-theme', savedTheme);
            }
        }
    }

    updateStats() {
        const count = this.history.length;
        this.statsCompliments.textContent = `${count} compliment${count !== 1 ? 's' : ''} generated`;
    }

    // === AUDIO RECORDING ===
    async startListening() {
        try {
            // Reset state
            this.transcript = '';
            this.audioChunks = [];
            this.timeRemaining = parseInt(this.recordingTime.value);
            this.transcriptContainer.classList.add('hidden');
            this.sentimentContainer.classList.add('hidden');
            this.complimentContainer.classList.add('hidden');

            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Update UI
            this.startBtn.classList.add('hidden');
            this.stopBtn.classList.remove('hidden');
            this.timer.classList.remove('hidden');
            this.visualizerContainer.classList.remove('hidden');
            this.statusMessage.textContent = 'Listening to conversation...';
            this.statusMessage.classList.remove('success', 'error');

            // Play start sound
            this.playSound('start');

            // Initialize speech recognition
            await this.initSpeechRecognition();

            // Initialize audio recording
            this.initMediaRecorder();

            // Initialize audio visualization
            this.initAudioVisualization();

            // Start timer
            this.startTimer();

        } catch (error) {
            console.error('Error starting recording:', error);
            this.statusMessage.textContent = 'Error: Could not access microphone. Please grant permission.';
            this.statusMessage.classList.add('error');
            this.reset();
        }
    }

    initMediaRecorder() {
        this.mediaRecorder = new MediaRecorder(this.stream);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            await this.processRecording(audioBlob);
        };

        this.mediaRecorder.start();
    }

    // === AUDIO VISUALIZATION ===
    initAudioVisualization() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(this.stream);
        source.connect(this.analyser);
        this.analyser.fftSize = 256;

        const canvas = this.visualizer;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            this.visualizerAnimationId = requestAnimationFrame(draw);

            this.analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgba(247, 250, 252, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

                const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
                gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
                gradient.addColorStop(1, 'rgba(118, 75, 162, 0.8)');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    }

    stopAudioVisualization() {
        if (this.visualizerAnimationId) {
            cancelAnimationFrame(this.visualizerAnimationId);
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.visualizerContainer.classList.add('hidden');
    }

    // === SPEECH RECOGNITION ===
    async initSpeechRecognition() {
        const provider = this.apiProvider.value;

        if (provider === 'browser') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                throw new Error('Browser does not support speech recognition. Please use Chrome or Edge, or configure an API provider.');
            }

            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                this.transcript += finalTranscript;
                this.updateTranscriptDisplay(this.transcript + interimTranscript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };

            this.recognition.start();
        }
    }

    updateTranscriptDisplay(text) {
        if (text.trim()) {
            this.transcriptContainer.classList.remove('hidden');
            this.transcriptEl.textContent = text;
        }
    }

    // === TIMER ===
    startTimer() {
        const totalTime = parseInt(this.recordingTime.value);
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            const progress = ((totalTime - this.timeRemaining) / totalTime) * 100;
            this.timerBar.style.width = progress + '%';

            if (this.timeRemaining <= 0) {
                this.stopListening();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        this.timerValue.textContent = this.timeRemaining;
    }

    stopListening() {
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Stop speech recognition
        if (this.recognition) {
            this.recognition.stop();
        }

        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // Stop media stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        // Stop audio visualization
        this.stopAudioVisualization();

        // Update UI
        this.stopBtn.classList.add('hidden');
        this.timer.classList.add('hidden');
        this.statusMessage.textContent = 'Processing and analyzing...';
    }

    // === PROCESSING ===
    async processRecording(audioBlob) {
        const provider = this.apiProvider.value;

        try {
            // If using browser speech recognition, we already have the transcript
            if (provider === 'browser') {
                if (!this.transcript.trim()) {
                    throw new Error('No speech detected. Please try again and speak clearly.');
                }
                await this.analyzeSentiment(this.transcript);
                await this.generateCompliment(this.transcript);
            } else {
                // Use API for transcription
                const transcription = await this.transcribeAudio(audioBlob, provider);
                this.transcript = transcription;
                this.updateTranscriptDisplay(transcription);
                await this.analyzeSentiment(transcription);
                await this.generateCompliment(transcription);
            }
        } catch (error) {
            console.error('Error processing recording:', error);
            this.statusMessage.textContent = `Error: ${error.message}`;
            this.statusMessage.classList.add('error');
            this.startBtn.classList.remove('hidden');
        }
    }

    // === TRANSCRIPTION ===
    async transcribeAudio(audioBlob, provider) {
        const apiKey = this.apiKey.value;

        if (!apiKey) {
            throw new Error('Please configure your API key in settings');
        }

        if (provider === 'openai') {
            return await this.transcribeWithOpenAI(audioBlob, apiKey);
        } else {
            throw new Error('Audio transcription is only available with OpenAI. For Anthropic, use browser-based speech recognition.');
        }
    }

    async transcribeWithOpenAI(audioBlob, apiKey) {
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Transcription failed');
        }

        const result = await response.json();
        return result.text;
    }

    // === SENTIMENT ANALYSIS ===
    async analyzeSentiment(transcript) {
        const words = transcript.toLowerCase();

        // Simple sentiment analysis
        const positiveWords = ['love', 'great', 'amazing', 'wonderful', 'happy', 'good', 'best', 'beautiful', 'enjoy', 'fun'];
        const enthusiasticWords = ['really', 'very', 'so', 'super', 'totally', 'absolutely', 'definitely', 'extremely', '!'];
        const thoughtfulWords = ['think', 'believe', 'feel', 'consider', 'understand', 'realize', 'reflect', 'meaning'];

        const positivity = this.calculateSentiment(words, positiveWords) * 100;
        const enthusiasm = this.calculateSentiment(words, enthusiasticWords) * 100;
        const depth = this.calculateSentiment(words, thoughtfulWords) * 100;

        // Animate sentiment bars
        this.sentimentContainer.classList.remove('hidden');

        setTimeout(() => {
            this.positivityBar.style.width = Math.min(positivity, 100) + '%';
        }, 100);

        setTimeout(() => {
            this.enthusiasmBar.style.width = Math.min(enthusiasm, 100) + '%';
        }, 300);

        setTimeout(() => {
            this.depthBar.style.width = Math.min(depth, 100) + '%';
        }, 500);

        // Show personality tags
        const traits = this.identifyTraits(transcript);
        this.personalityTags.innerHTML = traits.map(trait =>
            `<span class="personality-tag">${trait}</span>`
        ).join('');
    }

    calculateSentiment(text, keywords) {
        let count = 0;
        keywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            const matches = text.match(regex);
            if (matches) count += matches.length;
        });
        return Math.min(count / 10, 1);
    }

    identifyTraits(transcript) {
        const words = transcript.toLowerCase();
        const patterns = {
            creative: ['art', 'music', 'design', 'create', 'paint', 'draw', 'write', 'imagine'],
            analytical: ['think', 'analyze', 'solve', 'problem', 'logic', 'data', 'research', 'study'],
            compassionate: ['help', 'care', 'kind', 'support', 'love', 'friend', 'family', 'understand'],
            ambitious: ['goal', 'achieve', 'success', 'work', 'career', 'dream', 'build', 'grow'],
            curious: ['learn', 'wonder', 'explore', 'discover', 'question', 'why', 'how'],
            humorous: ['funny', 'laugh', 'joke', 'haha', 'lol', 'hilarious', 'humor'],
            adventurous: ['travel', 'adventure', 'explore', 'try', 'experience', 'new', 'journey'],
            thoughtful: ['consider', 'reflect', 'mean', 'matter', 'important', 'value', 'believe']
        };

        const traits = [];
        for (const [trait, keywords] of Object.entries(patterns)) {
            const matches = keywords.filter(keyword => words.includes(keyword)).length;
            if (matches >= 2) {
                traits.push(trait.charAt(0).toUpperCase() + trait.slice(1));
            }
        }

        return traits.length > 0 ? traits : ['Thoughtful'];
    }

    // === COMPLIMENT GENERATION ===
    async generateCompliment(transcript) {
        const provider = this.apiProvider.value;
        const apiKey = this.apiKey.value;

        this.statusMessage.textContent = 'Generating your perfect compliment...';

        try {
            let compliment;

            if (provider === 'browser') {
                compliment = this.generateLocalCompliment(transcript, this.currentStyle);
            } else if (provider === 'openai') {
                if (!apiKey) throw new Error('Please configure your OpenAI API key');
                compliment = await this.generateWithOpenAI(transcript, apiKey, this.currentStyle);
            } else if (provider === 'anthropic') {
                if (!apiKey) throw new Error('Please configure your Anthropic API key');
                compliment = await this.generateWithAnthropic(transcript, apiKey, this.currentStyle);
            }

            this.currentCompliment = {
                text: compliment,
                transcript: transcript,
                style: this.currentStyle,
                date: new Date().toISOString()
            };

            this.displayCompliment(compliment);

        } catch (error) {
            console.error('Error generating compliment:', error);
            this.statusMessage.textContent = `Error: ${error.message}`;
            this.statusMessage.classList.add('error');
            this.startBtn.classList.remove('hidden');
        }
    }

    generateLocalCompliment(transcript, style) {
        const traits = this.identifyTraits(transcript);
        const dominantTrait = traits[0]?.toLowerCase() || 'thoughtful';

        const complimentTemplates = {
            profound: this.getProfoundCompliments(),
            poetic: this.getPoeticCompliments(),
            casual: this.getCasualCompliments(),
            professional: this.getProfessionalCompliments()
        };

        const templates = complimentTemplates[style];
        const traitCompliments = templates[dominantTrait] || templates.thoughtful;
        return traitCompliments[Math.floor(Math.random() * traitCompliments.length)];
    }

    getProfoundCompliments() {
        return {
            creative: [
                "Your creative spirit transforms ordinary moments into extraordinary experiences. The way you see beauty and possibility where others see routine is truly inspiring.",
                "There's something magical about how your mind works - you have this rare ability to bring imagination to life in ways that touch people's hearts.",
                "Your creativity isn't just a skill, it's a gift you share with the world. The way you express yourself makes everything around you more vibrant."
            ],
            analytical: [
                "Your mind has this incredible clarity that cuts through complexity. The way you think through problems shows a depth of understanding that's genuinely rare.",
                "There's something remarkable about how you approach challenges - you have this gift for finding elegant solutions that others miss.",
                "Your analytical nature is paired with genuine wisdom. You don't just solve problems; you illuminate paths forward for everyone around you."
            ],
            compassionate: [
                "Your empathy creates a safe space for people to be themselves. The way you truly see and understand others is a profound gift.",
                "There's a warmth in how you connect with people that makes them feel valued and heard. Your compassion changes lives in ways you might not even realize.",
                "Your ability to care so deeply while staying strong is remarkable. You make the world softer and kinder just by being in it."
            ],
            ambitious: [
                "Your drive isn't just about personal success - it's inspiring to see how your ambition lifts everyone around you. You make people believe in what's possible.",
                "There's something powerful about your determination. You don't just chase dreams; you build them into reality with genuine grace and perseverance.",
                "Your ambition is matched by your integrity, and that combination is rare. You're not just going places - you're making the journey meaningful."
            ],
            curious: [
                "Your curiosity reveals a mind that's truly alive. The questions you ask and the connections you make show a depth of wonder that's contagious.",
                "There's something beautiful about how you approach the world with such openness. Your desire to understand and learn makes everyone around you more curious too.",
                "Your intellectual curiosity is paired with genuine humility, and that makes you someone people love to learn from and with."
            ],
            humorous: [
                "Your humor isn't just about making people laugh - it's about making them feel lighter and more connected. You have this gift for finding joy even in ordinary moments.",
                "There's an intelligence and warmth in your humor that brings people together. You make the world feel like a friendlier, happier place.",
                "Your ability to find and share laughter is a real superpower. You remind people not to take life too seriously while still taking each other seriously."
            ],
            adventurous: [
                "Your adventurous spirit inspires others to step outside their comfort zones. You show people that life is meant to be experienced, not just observed.",
                "There's a courage in how you embrace new experiences that's genuinely admirable. You don't just live life - you explore its possibilities.",
                "Your openness to adventure reveals a trust in yourself and the world that's both brave and beautiful. You make people want to say 'yes' more often."
            ],
            thoughtful: [
                "Your thoughtfulness shows a depth of character that's increasingly rare. You don't just think about things - you consider their meaning and impact.",
                "There's a wisdom in how you approach life that makes people feel understood and valued. Your reflective nature brings depth to every conversation.",
                "Your ability to pause and truly consider what matters shows a maturity and awareness that enriches everyone around you."
            ]
        };
    }

    getPoeticCompliments() {
        return {
            creative: [
                "Like a painter with words and a sculptor of moments, you create beauty from the canvas of everyday life.",
                "Your imagination blooms like wildflowers in spring - unexpected, vibrant, and impossible to ignore."
            ],
            analytical: [
                "Your mind is a lighthouse in the fog of confusion, guiding others to clarity with beams of brilliant insight.",
                "Like a master jeweler examining a diamond, you see facets and brilliance where others see only surface."
            ],
            compassionate: [
                "Your heart is a garden where others find shelter, and your kindness blooms like roses in every season.",
                "Like moonlight on water, your empathy creates a gentle illumination that soothes troubled souls."
            ],
            ambitious: [
                "You're building castles where others see only sand, turning dreams into monuments of possibility.",
                "Like a river carving through stone, your determination shapes reality itself through patient persistence."
            ],
            curious: [
                "Your mind is a butterfly in spring, flitting from flower to flower, collecting the nectar of knowledge.",
                "Like a child discovering snow for the first time, you approach the world with wonder that never fades."
            ],
            humorous: [
                "Your laughter is contagious sunlight, breaking through clouds and warming every soul it touches.",
                "Like a jester who's also a sage, you blend wisdom and wit into something truly magical."
            ],
            adventurous: [
                "You're a compass pointing toward possibility, showing others that the horizon is just an invitation.",
                "Like a bird greeting the dawn, you embrace each day as a new sky to explore."
            ],
            thoughtful: [
                "Your words are like stones dropped in still water, creating ripples of meaning that expand endlessly.",
                "Like an old oak in a forest, you offer shelter and wisdom to all who seek your shade."
            ]
        };
    }

    getCasualCompliments() {
        return {
            creative: [
                "Dude, your creative ideas are seriously next level. You've got this amazing way of making things interesting and unique.",
                "I love how you think outside the box! You bring such a fresh perspective to everything you touch."
            ],
            analytical: [
                "You're really good at figuring things out. Seriously, the way you break down complex stuff is impressive.",
                "Your problem-solving skills are on point! You always seem to find solutions that make total sense."
            ],
            compassionate: [
                "You're one of the most caring people I know. The way you look out for others is really special.",
                "Your kindness is genuine and it shows. People are lucky to have you in their corner."
            ],
            ambitious: [
                "Your hustle is inspiring! You're always working toward something bigger and better.",
                "I respect how driven you are. You don't just talk about goals - you actually go after them."
            ],
            curious: [
                "I love your curiosity! You ask the best questions and actually listen to the answers.",
                "You're always learning something new, and that's really cool. Your open mindedness is refreshing."
            ],
            humorous: [
                "You've got such a great sense of humor! You know exactly how to lighten the mood.",
                "Hanging out with you is always fun. You've got this way of making everything more enjoyable."
            ],
            adventurous: [
                "You're always up for trying new things, and that's awesome. Life's an adventure with you around!",
                "I love your adventurous spirit! You make people want to be more spontaneous."
            ],
            thoughtful: [
                "You really think about things, you know? Your perspective always adds something meaningful to conversations.",
                "I appreciate how thoughtful you are. You don't just react - you actually consider things carefully."
            ]
        };
    }

    getProfessionalCompliments() {
        return {
            creative: [
                "Your innovative thinking and creative approach consistently contribute fresh perspectives that enhance our collective work.",
                "Your ability to conceptualize and execute creative solutions demonstrates exceptional professional capabilities."
            ],
            analytical: [
                "Your analytical skills and systematic approach to problem-solving are invaluable assets to any team.",
                "The clarity and precision of your thinking enable efficient decision-making and strategic planning."
            ],
            compassionate: [
                "Your emotional intelligence and collaborative spirit create an environment where everyone can thrive.",
                "Your supportive approach and genuine investment in others' success strengthens team dynamics significantly."
            ],
            ambitious: [
                "Your dedication to excellence and continuous improvement sets a high standard for professional achievement.",
                "Your goal-oriented mindset and strategic vision position you as a natural leader in your field."
            ],
            curious: [
                "Your intellectual curiosity and commitment to continuous learning exemplify professional growth.",
                "Your inquisitive nature and desire to understand complexity contribute significantly to knowledge development."
            ],
            humorous: [
                "Your ability to maintain perspective and foster positive morale enhances workplace culture meaningfully.",
                "Your interpersonal skills and ability to create rapport contribute to a productive work environment."
            ],
            adventurous: [
                "Your willingness to embrace new challenges and explore innovative approaches drives organizational growth.",
                "Your adaptability and openness to change position you well for success in dynamic environments."
            ],
            thoughtful: [
                "Your reflective approach and consideration of diverse perspectives strengthen decision-making processes.",
                "Your strategic thinking and careful analysis contribute meaningfully to long-term success."
            ]
        };
    }

    async generateWithOpenAI(transcript, apiKey, style) {
        const stylePrompts = {
            profound: 'profound and deeply meaningful',
            poetic: 'poetic and metaphorical',
            casual: 'casual and friendly',
            professional: 'professional and respectful'
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are a master at crafting ${stylePrompts[style]} compliments. Generate ONE perfect compliment that:
1. Shows deep understanding of the person's interests, values, or personality
2. Is specific and personal, not generic
3. Is sincere and ${stylePrompts[style]}
4. Is 2-3 sentences long
5. Focuses on their character and deeper qualities

Make them think "Wow, this person really gets me."`
                    },
                    {
                        role: 'user',
                        content: `Based on this conversation, generate the perfect ${style} compliment:\n\n${transcript}`
                    }
                ],
                temperature: 0.9,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate compliment');
        }

        const result = await response.json();
        return result.choices[0].message.content.trim();
    }

    async generateWithAnthropic(transcript, apiKey, style) {
        const stylePrompts = {
            profound: 'profound and deeply meaningful',
            poetic: 'poetic and metaphorical',
            casual: 'casual and friendly',
            professional: 'professional and respectful'
        };

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 200,
                messages: [
                    {
                        role: 'user',
                        content: `You are a master at crafting ${stylePrompts[style]} compliments. Generate ONE perfect compliment that:

1. Shows deep understanding of the person's interests, values, or personality
2. Is specific and personal, not generic
3. Is sincere and ${stylePrompts[style]}
4. Is 2-3 sentences long
5. Focuses on their character and deeper qualities

Make them think "Wow, this person really gets me."

Based on this conversation, generate the perfect ${style} compliment:

${transcript}

Respond with ONLY the compliment, nothing else.`
                    }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate compliment');
        }

        const result = await response.json();
        return result.content[0].text.trim();
    }

    // === DISPLAY AND ACTIONS ===
    displayCompliment(compliment) {
        this.complimentEl.textContent = compliment;
        this.complimentContainer.classList.remove('hidden');
        this.statusMessage.textContent = 'Compliment generated successfully! ✨';
        this.statusMessage.classList.add('success');
        this.startBtn.classList.remove('hidden');

        // Auto-save if enabled
        if (this.autoSave.checked) {
            this.saveCompliment(true);
        }

        this.playSound('success');
    }

    changeStyle(style) {
        this.currentStyle = style;

        // Update UI
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.currentTarget.classList.add('active');

        // If we have a current compliment, regenerate with new style
        if (this.currentCompliment) {
            this.regenerateCompliment();
        }
    }

    async regenerateCompliment() {
        if (!this.currentCompliment) return;

        this.statusMessage.textContent = 'Regenerating with new style...';
        await this.generateCompliment(this.currentCompliment.transcript);
    }

    copyCompliment() {
        const compliment = this.complimentEl.textContent;
        navigator.clipboard.writeText(compliment).then(() => {
            const originalText = this.copyBtn.innerHTML;
            this.copyBtn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
            setTimeout(() => {
                this.copyBtn.innerHTML = originalText;
            }, 2000);
            this.playSound('click');
        });
    }

    saveCompliment(silent = false) {
        if (!this.currentCompliment) return;

        this.history.unshift({
            compliment: this.currentCompliment.text,
            date: this.currentCompliment.date
        });

        this.saveHistory();
        this.updateStats();

        if (!silent) {
            const originalText = this.saveBtn.innerHTML;
            this.saveBtn.innerHTML = '<span class="btn-icon">✓</span> Saved!';
            setTimeout(() => {
                this.saveBtn.innerHTML = originalText;
            }, 2000);
            this.playSound('success');
        }
    }

    // === SHARING ===
    openShareModal() {
        this.shareModal.classList.remove('hidden');
    }

    closeShareModalFn() {
        this.shareModal.classList.add('hidden');
    }

    handleShare(platform) {
        const compliment = this.complimentEl.textContent;
        const text = encodeURIComponent(`"${compliment}" - Generated by The Perfect Compliment Generator`);
        const url = encodeURIComponent(window.location.href);

        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:?subject=A Perfect Compliment&body=${text}`;
                break;
            case 'download':
                this.downloadComplimentImage();
                break;
        }

        this.closeShareModalFn();
        this.playSound('click');
    }

    downloadComplimentImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 600;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Compliment text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';

        const compliment = this.complimentEl.textContent;
        const words = compliment.split(' ');
        let line = '';
        let y = 250;
        const maxWidth = 700;
        const lineHeight = 45;

        words.forEach((word, index) => {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && index > 0) {
                ctx.fillText(line, canvas.width / 2, y);
                line = word + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        });
        ctx.fillText(line, canvas.width / 2, y);

        // Footer
        ctx.font = '20px Arial';
        ctx.fillText('- The Perfect Compliment Generator', canvas.width / 2, canvas.height - 50);

        // Download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'compliment.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // === UTILITY ===
    showAbout() {
        alert(`The Perfect Compliment Generator

An AI-powered app that listens to conversations and generates deeply personalized, meaningful compliments.

Features:
✨ Real-time audio visualization
🎨 Multiple compliment styles
📊 Sentiment analysis
💾 Compliment history
🎯 Theme customization
🔗 Social sharing

Built with love to help people feel truly seen and appreciated.`);
    }

    exportData() {
        const data = {
            history: this.history,
            settings: {
                apiProvider: this.apiProvider.value,
                recordingTime: this.recordingTime.value,
                soundEffects: this.soundEffects.checked,
                autoSave: this.autoSave.checked,
                theme: this.currentTheme
            },
            stats: {
                totalComplimentsGenerated: this.totalComplimentsGenerated
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compliment-generator-data.json';
        a.click();
        URL.revokeObjectURL(url);

        this.playSound('success');
    }

    playSound(type) {
        if (!this.soundEffects.checked) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const sounds = {
            start: { frequency: 440, duration: 0.1 },
            success: { frequency: 880, duration: 0.2 },
            click: { frequency: 660, duration: 0.05 }
        };

        const sound = sounds[type] || sounds.click;
        oscillator.frequency.value = sound.frequency;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + sound.duration);
    }

    reset() {
        // Stop any ongoing recording
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.recognition) {
            this.recognition.stop();
        }
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.stopAudioVisualization();

        // Reset UI
        this.startBtn.classList.remove('hidden');
        this.stopBtn.classList.add('hidden');
        this.timer.classList.add('hidden');
        this.transcriptContainer.classList.add('hidden');
        this.sentimentContainer.classList.add('hidden');
        this.complimentContainer.classList.add('hidden');
        this.statusMessage.textContent = 'Ready to listen to a conversation';
        this.statusMessage.classList.remove('success', 'error');
        this.timeRemaining = parseInt(this.recordingTime.value);
        this.transcript = '';
        this.audioChunks = [];
        this.currentCompliment = null;
        this.timerBar.style.width = '0%';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ComplimentGenerator();
});
