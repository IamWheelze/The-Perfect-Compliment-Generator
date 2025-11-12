// The Perfect Compliment Generator
// Main application logic

class ComplimentGenerator {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.timerInterval = null;
        this.timeRemaining = 30;
        this.recognition = null;
        this.transcript = '';

        this.initElements();
        this.initEventListeners();
        this.loadSettings();
    }

    initElements() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.timer = document.getElementById('timer');
        this.statusMessage = document.getElementById('statusMessage');
        this.transcriptContainer = document.getElementById('transcriptContainer');
        this.transcriptEl = document.getElementById('transcript');
        this.complimentContainer = document.getElementById('complimentContainer');
        this.complimentEl = document.getElementById('compliment');
        this.copyBtn = document.getElementById('copyBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.apiProvider = document.getElementById('apiProvider');
        this.apiKey = document.getElementById('apiKey');
        this.apiKeyGroup = document.getElementById('apiKeyGroup');
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startListening());
        this.stopBtn.addEventListener('click', () => this.stopListening());
        this.copyBtn.addEventListener('click', () => this.copyCompliment());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.apiProvider.addEventListener('change', () => this.handleProviderChange());
        this.apiKey.addEventListener('change', () => this.saveSettings());
    }

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
    }

    loadSettings() {
        const savedProvider = localStorage.getItem('apiProvider');
        const savedKey = localStorage.getItem('apiKey');

        if (savedProvider) {
            this.apiProvider.value = savedProvider;
            this.handleProviderChange();
        }

        if (savedKey) {
            this.apiKey.value = savedKey;
        }
    }

    async startListening() {
        try {
            // Reset state
            this.transcript = '';
            this.audioChunks = [];
            this.timeRemaining = 30;
            this.transcriptContainer.classList.add('hidden');
            this.complimentContainer.classList.add('hidden');

            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Update UI
            this.startBtn.classList.add('hidden');
            this.stopBtn.classList.remove('hidden');
            this.timer.classList.remove('hidden');
            this.statusMessage.textContent = 'Listening to conversation...';

            // Initialize speech recognition
            await this.initSpeechRecognition();

            // Initialize audio recording
            this.initMediaRecorder();

            // Start timer
            this.startTimer();

        } catch (error) {
            console.error('Error starting recording:', error);
            this.statusMessage.textContent = 'Error: Could not access microphone. Please grant permission.';
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

    async initSpeechRecognition() {
        const provider = this.apiProvider.value;

        if (provider === 'browser') {
            // Use browser's Web Speech API
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

    startTimer() {
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.stopListening();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        this.timer.textContent = this.timeRemaining;
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

        // Update UI
        this.stopBtn.classList.add('hidden');
        this.timer.classList.add('hidden');
        this.statusMessage.textContent = 'Processing and analyzing...';
    }

    async processRecording(audioBlob) {
        const provider = this.apiProvider.value;

        try {
            // If using browser speech recognition, we already have the transcript
            if (provider === 'browser') {
                if (!this.transcript.trim()) {
                    throw new Error('No speech detected. Please try again and speak clearly.');
                }
                await this.generateCompliment(this.transcript);
            } else {
                // Use API for transcription
                const transcription = await this.transcribeAudio(audioBlob, provider);
                this.transcript = transcription;
                this.updateTranscriptDisplay(transcription);
                await this.generateCompliment(transcription);
            }
        } catch (error) {
            console.error('Error processing recording:', error);
            this.statusMessage.textContent = `Error: ${error.message}`;
            this.startBtn.classList.remove('hidden');
        }
    }

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

    async generateCompliment(transcript) {
        const provider = this.apiProvider.value;
        const apiKey = this.apiKey.value;

        this.statusMessage.textContent = 'Generating your perfect compliment...';

        try {
            let compliment;

            if (provider === 'browser') {
                // Use a local algorithm (simple but effective)
                compliment = this.generateLocalCompliment(transcript);
            } else if (provider === 'openai') {
                if (!apiKey) throw new Error('Please configure your OpenAI API key');
                compliment = await this.generateWithOpenAI(transcript, apiKey);
            } else if (provider === 'anthropic') {
                if (!apiKey) throw new Error('Please configure your Anthropic API key');
                compliment = await this.generateWithAnthropic(transcript, apiKey);
            }

            this.displayCompliment(compliment);

        } catch (error) {
            console.error('Error generating compliment:', error);
            this.statusMessage.textContent = `Error: ${error.message}`;
            this.startBtn.classList.remove('hidden');
        }
    }

    generateLocalCompliment(transcript) {
        // Analyze transcript for keywords and themes
        const words = transcript.toLowerCase();

        // Define interest/personality patterns
        const patterns = {
            creative: ['art', 'music', 'design', 'create', 'paint', 'draw', 'write', 'imagine'],
            analytical: ['think', 'analyze', 'solve', 'problem', 'logic', 'data', 'research', 'study'],
            compassionate: ['help', 'care', 'kind', 'support', 'love', 'friend', 'family', 'understand'],
            ambitious: ['goal', 'achieve', 'success', 'work', 'career', 'dream', 'build', 'grow'],
            curious: ['learn', 'wonder', 'explore', 'discover', 'question', 'why', 'how', 'understand'],
            humorous: ['funny', 'laugh', 'joke', 'haha', 'lol', 'hilarious', 'humor'],
            adventurous: ['travel', 'adventure', 'explore', 'try', 'experience', 'new', 'journey'],
            thoughtful: ['consider', 'reflect', 'mean', 'matter', 'important', 'value', 'believe']
        };

        // Count matches for each trait
        const scores = {};
        for (const [trait, keywords] of Object.entries(patterns)) {
            scores[trait] = keywords.filter(keyword => words.includes(keyword)).length;
        }

        // Find dominant trait
        const dominantTrait = Object.entries(scores)
            .sort(([, a], [, b]) => b - a)[0][0];

        // Generate compliments based on dominant trait
        const compliments = {
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

        // Select a random compliment from the dominant trait
        const traitCompliments = compliments[dominantTrait] || compliments.thoughtful;
        const selectedCompliment = traitCompliments[Math.floor(Math.random() * traitCompliments.length)];

        return selectedCompliment;
    }

    async generateWithOpenAI(transcript, apiKey) {
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
                        content: `You are a master at understanding people deeply and crafting incredibly meaningful, specific compliments. Your task is to analyze a conversation transcript and generate ONE perfect compliment that:

1. Shows deep understanding of the person's interests, values, or personality
2. Is specific and personal, not generic
3. Is sincere and profound, making them feel truly seen
4. Is 2-3 sentences long
5. Focuses on their character, not just surface traits

The compliment should make them think "Wow, this person really gets me."`
                    },
                    {
                        role: 'user',
                        content: `Based on this conversation, generate the perfect compliment:\n\n${transcript}`
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

    async generateWithAnthropic(transcript, apiKey) {
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
                        content: `You are a master at understanding people deeply and crafting incredibly meaningful, specific compliments. Your task is to analyze a conversation transcript and generate ONE perfect compliment that:

1. Shows deep understanding of the person's interests, values, or personality
2. Is specific and personal, not generic
3. Is sincere and profound, making them feel truly seen
4. Is 2-3 sentences long
5. Focuses on their character, not just surface traits

The compliment should make them think "Wow, this person really gets me."

Based on this conversation, generate the perfect compliment:

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

    displayCompliment(compliment) {
        this.complimentEl.textContent = compliment;
        this.complimentContainer.classList.remove('hidden');
        this.statusMessage.textContent = 'Compliment generated successfully! ✨';
        this.startBtn.classList.remove('hidden');
    }

    copyCompliment() {
        const compliment = this.complimentEl.textContent;
        navigator.clipboard.writeText(compliment).then(() => {
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
            }, 2000);
        });
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

        // Reset UI
        this.startBtn.classList.remove('hidden');
        this.stopBtn.classList.add('hidden');
        this.timer.classList.add('hidden');
        this.transcriptContainer.classList.add('hidden');
        this.complimentContainer.classList.add('hidden');
        this.statusMessage.textContent = 'Ready to listen to a conversation';
        this.timeRemaining = 30;
        this.transcript = '';
        this.audioChunks = [];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ComplimentGenerator();
});
