import React, { useState, useRef, useEffect } from 'react';
import './HealthChatbot.css';

const HealthChatbot = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: '🤖 Hello! I\'m your Health Assistant for space missions. I can help detect and explain astronaut health issues. What symptoms or concerns would you like to discuss?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState(0.9);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Text-to-Speech function
  const speakText = (text) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text for better speech
    const cleanText = text
      .replace(/🤖|📊|🔍|💊|⚠️|💡|🎯|📋|🔬/g, '') // Remove emojis
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\n+/g, '. ') // Replace line breaks with pauses
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = voiceRate;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Try to use a more natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') || 
      voice.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Start voice recognition
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Health knowledge base for space-related conditions
  const healthKnowledge = {
    'muscle atrophy': {
      symptoms: ['weakness', 'muscle loss', 'fatigue', 'reduced strength'],
      explanation: 'Muscle atrophy occurs in microgravity due to lack of resistance against gravity. Muscles, especially in legs and back, can lose up to 20% of mass in 5-11 days.',
      detection: 'Monitor strength tests, muscle mass measurements, and exercise performance',
      treatment: 'COLPA (Combined Operational Load Bearing External Resistance) exercises, resistance training 2.5 hours daily',
      severity: 'high'
    },
    'bone density loss': {
      symptoms: ['joint pain', 'fracture risk', 'calcium loss', 'bone pain'],
      explanation: 'Astronauts lose 1-2% of bone mass per month in space due to lack of weight-bearing activities and altered calcium metabolism.',
      detection: 'DEXA scans, blood calcium levels, bone biomarkers (CTX, P1NP)',
      treatment: 'Bisphosphonates, vitamin D supplementation, resistance exercises',
      severity: 'high'
    },
    'space motion sickness': {
      symptoms: ['nausea', 'vomiting', 'dizziness', 'headache', 'disorientation'],
      explanation: 'Occurs in 60-80% of astronauts during first 2-3 days due to conflicting signals between vestibular system and visual input in microgravity.',
      detection: 'Symptom reporting, balance tests, eye movement tracking',
      treatment: 'Scopolamine patches, promethazine, adaptation training',
      severity: 'medium'
    },
    'fluid shift': {
      symptoms: ['puffy face', 'nasal congestion', 'headache', 'leg shrinkage'],
      explanation: 'In microgravity, body fluids shift upward causing facial puffiness and potential intracranial pressure changes.',
      detection: 'Facial imaging, leg volume measurements, intracranial pressure monitoring',
      treatment: 'Lower body negative pressure, fluid management, exercise',
      severity: 'medium'
    },
    'vision problems': {
      symptoms: ['blurred vision', 'eye pressure', 'optic disc swelling', 'visual field changes'],
      explanation: 'SANS (Spaceflight Associated Neuro-ocular Syndrome) affects 60% of long-duration astronauts due to fluid shifts and intracranial pressure.',
      detection: 'Optical coherence tomography, fundus photography, visual acuity tests',
      treatment: 'Currently under research - potential treatments include lower body negative pressure',
      severity: 'high'
    },
    'immune system': {
      symptoms: ['frequent infections', 'slow healing', 'fatigue', 'skin problems'],
      explanation: 'Spaceflight causes immune system dysregulation due to stress, radiation, and microgravity effects on immune cells.',
      detection: 'Complete blood count, cytokine levels, immune cell function tests',
      treatment: 'Nutritional support, stress management, exercise, potential immunomodulators',
      severity: 'medium'
    },
    'radiation exposure': {
      symptoms: ['fatigue', 'nausea', 'skin changes', 'blood count changes'],
      explanation: 'Cosmic radiation and solar particle events pose cancer and acute radiation risks beyond Earth\'s magnetic field.',
      detection: 'Personal dosimeters, blood tests, chromosome aberration analysis',
      treatment: 'Shielding, activity restrictions during solar events, antioxidants',
      severity: 'high'
    },
    'sleep disorders': {
      symptoms: ['insomnia', 'fatigue', 'poor concentration', 'mood changes'],
      explanation: 'Disrupted circadian rhythms due to 16 sunrises/sunsets daily and operational schedules affect 75% of astronauts.',
      detection: 'Sleep logs, actigraphy, cognitive performance tests',
      treatment: 'Light therapy, melatonin, sleep hygiene protocols, scheduled rest periods',
      severity: 'medium'
    }
  };

  // Symptom analysis function
  const analyzeSymptoms = (userInput) => {
    const input = userInput.toLowerCase();
    const detectedConditions = [];
    
    Object.entries(healthKnowledge).forEach(([condition, data]) => {
      const matchScore = data.symptoms.reduce((score, symptom) => {
        return input.includes(symptom.toLowerCase()) ? score + 1 : score;
      }, 0);
      
      if (matchScore > 0 || input.includes(condition)) {
        detectedConditions.push({
          condition,
          data,
          matchScore,
          confidence: Math.min((matchScore / data.symptoms.length) * 100, 100)
        });
      }
    });

    return detectedConditions.sort((a, b) => b.confidence - a.confidence);
  };

  // Generate AI response
  const generateResponse = (userInput) => {
    const detectedConditions = analyzeSymptoms(userInput);
    
    if (detectedConditions.length === 0) {
      return `I understand you're asking about "${userInput}". While I didn't detect specific space health conditions, I can help with:\n\n🔍 **Common Space Health Issues:**\n• Muscle atrophy and bone loss\n• Space motion sickness\n• Vision problems (SANS)\n• Fluid shifts and facial puffiness\n• Sleep disorders\n• Radiation exposure effects\n• Immune system changes\n\nPlease describe any specific symptoms you're experiencing, and I'll provide detailed analysis and recommendations.`;
    }

    const primaryCondition = detectedConditions[0];
    const { condition, data, confidence } = primaryCondition;

    let response = `🎯 **Analysis Complete** (${confidence.toFixed(0)}% confidence)\n\n`;
    response += `**Detected Condition:** ${condition.toUpperCase()}\n\n`;
    response += `📋 **Explanation:**\n${data.explanation}\n\n`;
    response += `🔬 **Detection Methods:**\n${data.detection}\n\n`;
    response += `💊 **Treatment/Management:**\n${data.treatment}\n\n`;
    response += `⚠️ **Severity Level:** ${data.severity.toUpperCase()}\n\n`;

    if (detectedConditions.length > 1) {
      response += `🔍 **Other Possible Conditions:**\n`;
      detectedConditions.slice(1, 3).forEach(({ condition: cond, confidence: conf }) => {
        response += `• ${cond} (${conf.toFixed(0)}% match)\n`;
      });
    }

    response += `\n💡 **Recommendation:** ${getSeverityRecommendation(data.severity)}`;

    return response;
  };

  const getSeverityRecommendation = (severity) => {
    switch (severity) {
      case 'high':
        return 'Immediate medical consultation recommended. Monitor closely and implement preventive measures.';
      case 'medium':
        return 'Schedule regular monitoring. Implement recommended countermeasures and lifestyle adjustments.';
      case 'low':
        return 'Continue routine monitoring. Maintain healthy space lifestyle practices.';
      default:
        return 'Consult with flight surgeon for personalized recommendations.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      type: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const responseText = generateResponse(currentInput);
      const botResponse = {
        type: 'bot',
        text: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
      
      // Automatically speak the response if speech is enabled
      if (speechEnabled) {
        setTimeout(() => speakText(responseText), 500);
      }
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "I'm feeling weak and tired",
    "Having vision problems",
    "Experiencing nausea and dizziness",
    "Face feels puffy and congested",
    "Having trouble sleeping",
    "Concerned about radiation exposure"
  ];

  // Voice command for quick questions
  const handleQuickQuestion = (question) => {
    setInputText(question);
    if (speechEnabled) {
      speakText(`You selected: ${question}. Processing your health inquiry.`);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-info">
          <h3>🤖 Health Assistant</h3>
          <span className="status-indicator">● Online</span>
          {isSpeaking && <span className="speaking-indicator">🔊 Speaking</span>}
          {isListening && <span className="listening-indicator">🎤 Listening</span>}
        </div>
        <div className="header-controls">
          <button
            className={`voice-control-btn ${speechEnabled ? 'active' : ''}`}
            onClick={() => setSpeechEnabled(!speechEnabled)}
            title="Toggle Text-to-Speech"
          >
            {speechEnabled ? '🔊' : '🔇'}
          </button>
          <div className="voice-rate-control">
            <label>Speed:</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceRate}
              onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
              className="rate-slider"
            />
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'bot' ? '🤖' : '👨‍🚀'}
            </div>
            <div className="message-content">
              <div className="message-text">
                {message.text.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              <div className="message-actions">
                {message.type === 'bot' && (
                  <>
                    <button
                      className="speak-btn"
                      onClick={() => speakText(message.text)}
                      disabled={isSpeaking}
                      title="Read message aloud"
                    >
                      🔊
                    </button>
                    {isSpeaking && (
                      <button
                        className="stop-speak-btn"
                        onClick={stopSpeaking}
                        title="Stop speaking"
                      >
                        ⏹️
                      </button>
                    )}
                  </>
                )}
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-questions">
        <div className="quick-questions-title">Quick Questions:</div>
        <div className="quick-questions-grid">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="quick-question-btn"
              onClick={() => handleQuickQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="input-container">
        <div className="voice-input-controls">
          <button
            className={`voice-btn ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopListening : startListening}
            disabled={isSpeaking}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? '🎤' : '🎙️'}
          </button>
          {isListening && (
            <div className="listening-animation">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your symptoms, ask about space health issues, or use voice input..."
          className="message-input"
          rows="2"
        />
        <button 
          onClick={handleSendMessage}
          className="send-button"
          disabled={!inputText.trim() || isTyping}
        >
          🚀
        </button>
      </div>
    </div>
  );
};

export default HealthChatbot;
