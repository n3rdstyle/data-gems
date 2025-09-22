// Quiz Page JavaScript
// Runs in the separate quiz webpage and communicates with the extension

class QuizPage {
  constructor() {
    this.currentQuestion = null;
    this.history = [];
    this.addedCount = 0;
    this.questionNumber = 0;
    this.answeredQuestions = new Set();
    this.questionFeedback = {};

    // Initialize questions (same as before but simplified)
    this.initializeQuestions();

    // Load saved data
    this.loadData();

    // Setup event listeners
    this.setupEventListeners();

    // Start quiz
    setTimeout(() => {
      this.startQuiz();
    }, 500);
  }

  initializeQuestions() {
    this.questions = [
      // Food & Drink
      {
        id: 'pizza',
        question: 'Do you enjoy eating pizza?',
        category: 'Food & Drink',
        yesAnswer: 'I enjoy eating pizza',
        noAnswer: "I don't enjoy pizza"
      },
      {
        id: 'coffee',
        question: 'Do you drink coffee regularly?',
        category: 'Food & Drink',
        yesAnswer: 'I drink coffee regularly',
        noAnswer: "I don't drink coffee regularly"
      },
      {
        id: 'cooking',
        question: 'Do you enjoy cooking at home?',
        category: 'Food & Drink',
        yesAnswer: 'I enjoy cooking at home',
        noAnswer: 'I prefer eating out or ordering food'
      },
      {
        id: 'spicy-food',
        question: 'Do you like spicy food?',
        category: 'Food & Drink',
        yesAnswer: 'I enjoy spicy food',
        noAnswer: 'I prefer mild food'
      },
      {
        id: 'vegetarian',
        question: 'Are you vegetarian or vegan?',
        category: 'Food & Drink',
        yesAnswer: 'I follow a vegetarian or vegan diet',
        noAnswer: 'I eat meat'
      },
      {
        id: 'breakfast',
        question: 'Do you eat breakfast every day?',
        category: 'Food & Drink',
        yesAnswer: 'I eat breakfast daily',
        noAnswer: 'I often skip breakfast'
      },

      // Work & Professional
      {
        id: 'remote-work',
        question: 'Do you prefer working from home?',
        category: 'Work & Professional',
        yesAnswer: 'I prefer working from home',
        noAnswer: 'I prefer working in an office'
      },
      {
        id: 'morning-person',
        question: 'Are you a morning person?',
        category: 'Work & Professional',
        yesAnswer: "I'm a morning person",
        noAnswer: "I'm more productive later in the day"
      },
      {
        id: 'team-work',
        question: 'Do you enjoy working in teams?',
        category: 'Work & Professional',
        yesAnswer: 'I enjoy collaborative team work',
        noAnswer: 'I prefer working independently'
      },
      {
        id: 'meetings',
        question: 'Do you find meetings productive?',
        category: 'Work & Professional',
        yesAnswer: 'I find meetings productive and valuable',
        noAnswer: 'I prefer async communication over meetings'
      },
      {
        id: 'multitasking',
        question: 'Are you good at multitasking?',
        category: 'Work & Professional',
        yesAnswer: 'I can effectively multitask',
        noAnswer: 'I prefer focusing on one task at a time'
      },

      // Hobbies
      {
        id: 'reading',
        question: 'Do you enjoy reading books?',
        category: 'Hobbies',
        yesAnswer: 'I enjoy reading books',
        noAnswer: "I don't read books often"
      },
      {
        id: 'gaming',
        question: 'Do you play video games?',
        category: 'Hobbies',
        yesAnswer: 'I enjoy playing video games',
        noAnswer: "I don't play video games"
      },
      {
        id: 'sports',
        question: 'Do you play or watch sports?',
        category: 'Hobbies',
        yesAnswer: 'I enjoy sports',
        noAnswer: "I'm not interested in sports"
      },
      {
        id: 'gardening',
        question: 'Do you enjoy gardening?',
        category: 'Hobbies',
        yesAnswer: 'I enjoy gardening',
        noAnswer: "I don't have interest in gardening"
      },
      {
        id: 'art',
        question: 'Do you create or appreciate art?',
        category: 'Hobbies',
        yesAnswer: 'I enjoy creating or viewing art',
        noAnswer: "I'm not particularly interested in art"
      },

      // Travel & Activities
      {
        id: 'travel',
        question: 'Do you enjoy traveling?',
        category: 'Travel & Activities',
        yesAnswer: 'I love traveling and exploring new places',
        noAnswer: 'I prefer staying close to home'
      },
      {
        id: 'beach-mountains',
        question: 'Do you prefer beaches over mountains?',
        category: 'Travel & Activities',
        yesAnswer: 'I prefer beach vacations',
        noAnswer: 'I prefer mountain destinations'
      },
      {
        id: 'outdoor-activities',
        question: 'Do you enjoy outdoor activities?',
        category: 'Travel & Activities',
        yesAnswer: 'I enjoy outdoor activities and nature',
        noAnswer: 'I prefer indoor activities'
      },
      {
        id: 'camping',
        question: 'Do you enjoy camping?',
        category: 'Travel & Activities',
        yesAnswer: 'I enjoy camping and being in nature',
        noAnswer: 'I prefer hotels and comfort'
      },
      {
        id: 'adventure',
        question: 'Are you adventurous?',
        category: 'Travel & Activities',
        yesAnswer: 'I love trying new and adventurous activities',
        noAnswer: 'I prefer familiar and safe activities'
      },

      // Lifestyle & Preferences
      {
        id: 'minimalist',
        question: 'Do you consider yourself a minimalist?',
        category: 'Lifestyle & Preferences',
        yesAnswer: 'I embrace minimalism',
        noAnswer: 'I like having many possessions'
      },
      {
        id: 'pets',
        question: 'Do you have or want pets?',
        category: 'Lifestyle & Preferences',
        yesAnswer: 'I love having pets',
        noAnswer: "I prefer not to have pets"
      },
      {
        id: 'exercise',
        question: 'Do you exercise regularly?',
        category: 'Lifestyle & Preferences',
        yesAnswer: 'I exercise regularly',
        noAnswer: "I don't exercise regularly"
      },
      {
        id: 'organized',
        question: 'Are you an organized person?',
        category: 'Lifestyle & Preferences',
        yesAnswer: "I'm very organized and tidy",
        noAnswer: "I'm more relaxed about organization"
      },
      {
        id: 'routine',
        question: 'Do you prefer having a routine?',
        category: 'Lifestyle & Preferences',
        yesAnswer: 'I thrive with routine and structure',
        noAnswer: 'I prefer flexibility and spontaneity'
      },

      // Entertainment & Media
      {
        id: 'movies',
        question: 'Do you prefer movies over TV shows?',
        category: 'Entertainment & Media',
        yesAnswer: 'I prefer watching movies',
        noAnswer: 'I prefer TV shows and series'
      },
      {
        id: 'documentaries',
        question: 'Do you enjoy documentaries?',
        category: 'Entertainment & Media',
        yesAnswer: 'I enjoy watching documentaries',
        noAnswer: 'I prefer fiction over documentaries'
      },
      {
        id: 'podcasts',
        question: 'Do you listen to podcasts?',
        category: 'Entertainment & Media',
        yesAnswer: 'I regularly listen to podcasts',
        noAnswer: "I don't listen to podcasts"
      },
      {
        id: 'music-daily',
        question: 'Do you listen to music daily?',
        category: 'Entertainment & Media',
        yesAnswer: 'I listen to music every day',
        noAnswer: 'I rarely listen to music'
      },
      {
        id: 'news',
        question: 'Do you follow the news regularly?',
        category: 'Entertainment & Media',
        yesAnswer: 'I follow news and current events',
        noAnswer: 'I avoid or rarely check the news'
      },

      // Social & Personal
      {
        id: 'introvert',
        question: 'Do you consider yourself introverted?',
        category: 'Social & Personal',
        yesAnswer: "I'm more introverted",
        noAnswer: "I'm more extroverted"
      },
      {
        id: 'large-gatherings',
        question: 'Do you enjoy large social gatherings?',
        category: 'Social & Personal',
        yesAnswer: 'I enjoy large social gatherings',
        noAnswer: 'I prefer small groups or one-on-one interactions'
      },
      {
        id: 'spontaneous',
        question: 'Are you spontaneous or a planner?',
        category: 'Social & Personal',
        yesAnswer: "I'm spontaneous and flexible",
        noAnswer: 'I prefer planning things in advance'
      },
      {
        id: 'public-speaking',
        question: 'Are you comfortable with public speaking?',
        category: 'Social & Personal',
        yesAnswer: "I'm comfortable speaking in public",
        noAnswer: 'I avoid public speaking when possible'
      },

      // Technology
      {
        id: 'early-adopter',
        question: 'Are you an early adopter of new technology?',
        category: 'Technology & Communication',
        yesAnswer: 'I love trying new technology early',
        noAnswer: 'I wait until technology is proven'
      },
      {
        id: 'social-media',
        question: 'Are you active on social media?',
        category: 'Technology & Communication',
        yesAnswer: "I'm active on social media",
        noAnswer: 'I avoid or rarely use social media'
      },
      {
        id: 'ai-tools',
        question: 'Do you use AI tools regularly?',
        category: 'Technology & Communication',
        yesAnswer: 'I regularly use AI tools',
        noAnswer: 'I rarely or never use AI tools'
      },
      {
        id: 'privacy-conscious',
        question: 'Are you privacy-conscious online?',
        category: 'Technology & Communication',
        yesAnswer: "I'm very careful about online privacy",
        noAnswer: "I'm less concerned about online privacy"
      }
    ];

    this.shuffleArray(this.questions);
  }

  async loadData() {
    try {
      const result = await chrome.storage.local.get(['questionFeedback', 'quizHistory']);
      this.questionFeedback = result.questionFeedback || {};

      // Load any previous session data if needed
      if (result.quizHistory) {
        this.answeredQuestions = new Set(result.quizHistory || []);
      }
    } catch (error) {
      console.log('Running in standalone mode or storage not available');
    }
  }

  startQuiz() {
    // Hide loading, show content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('quizContent').style.display = 'block';

    // Get first question
    const firstQuestion = this.getNextQuestion();
    this.displayQuestion(firstQuestion);
  }

  getNextQuestion() {
    const availableQuestions = this.questions.filter(q => {
      if (this.answeredQuestions.has(q.id)) return false;
      const feedback = this.questionFeedback[q.id] || { down: 0 };
      if (feedback.down >= 3) return false;
      return true;
    });

    if (availableQuestions.length === 0) {
      this.answeredQuestions.clear();
      return this.getNextQuestion();
    }

    // Balance categories
    const categoryCounts = {};
    this.history.forEach(item => {
      categoryCounts[item.question.category] = (categoryCounts[item.question.category] || 0) + 1;
    });

    let leastUsedCategory = null;
    let minCount = Infinity;
    availableQuestions.forEach(q => {
      const count = categoryCounts[q.category] || 0;
      if (count < minCount) {
        minCount = count;
        leastUsedCategory = q.category;
      }
    });

    const preferredQuestions = availableQuestions.filter(q => q.category === leastUsedCategory);
    const questionPool = preferredQuestions.length > 0 ? preferredQuestions : availableQuestions;

    return questionPool[Math.floor(Math.random() * questionPool.length)];
  }

  displayQuestion(question) {
    this.currentQuestion = question;
    this.questionNumber++;

    // Update UI
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('questionCategory').textContent = question.category;

    // Update choice panels text based on question context
    const yesText = this.getContextualText(question, 'yes');
    const noText = this.getContextualText(question, 'no');

    document.getElementById('yesText').textContent = yesText;
    document.getElementById('noText').textContent = noText;

    // Reset feedback buttons
    document.getElementById('thumbsUpBtn').classList.remove('active');
    document.getElementById('thumbsDownBtn').classList.remove('active');

    // Show current feedback if exists
    const feedback = this.questionFeedback[question.id];
    if (feedback?.userVote === 'up') {
      document.getElementById('thumbsUpBtn').classList.add('active');
    } else if (feedback?.userVote === 'down') {
      document.getElementById('thumbsDownBtn').classList.add('active');
    }
  }

  async answerQuestion(answer) {
    if (!this.currentQuestion) return;

    const preference = {
      id: Date.now().toString(),
      category: this.currentQuestion.category,
      question: this.currentQuestion.question.replace('Do you ', '').replace('Are you ', '').replace('?', ''),
      answer: answer === 'yes' ? this.currentQuestion.yesAnswer : this.currentQuestion.noAnswer,
      source: 'quick-quiz',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.history.push({
      question: this.currentQuestion,
      answer: answer,
      preference: preference
    });

    this.answeredQuestions.add(this.currentQuestion.id);

    // Save to extension storage
    await this.addToProfile(preference);

    this.addedCount++;
    this.updateProgress();

    // Enable undo button
    document.getElementById('undoBtn').disabled = false;

    // Show success message
    this.showSuccessMessage();

    // Get next question
    const nextQuestion = this.getNextQuestion();
    this.displayQuestion(nextQuestion);
  }

  async addToProfile(preference) {
    try {
      const result = await chrome.storage.local.get(['contextItems']);
      const items = result.contextItems || [];
      items.push(preference);
      await chrome.storage.local.set({ contextItems: items });
    } catch (error) {
      console.error('Failed to add preference:', error);
      // Store locally if extension storage not available
      const stored = localStorage.getItem('tempPreferences') || '[]';
      const temp = JSON.parse(stored);
      temp.push(preference);
      localStorage.setItem('tempPreferences', JSON.stringify(temp));
    }
  }

  async removeFromProfile(preferenceId) {
    try {
      const result = await chrome.storage.local.get(['contextItems']);
      let items = result.contextItems || [];
      items = items.filter(item => item.id !== preferenceId);
      await chrome.storage.local.set({ contextItems: items });
    } catch (error) {
      console.error('Failed to remove preference:', error);
    }
  }

  skipQuestion() {
    if (this.currentQuestion) {
      this.answeredQuestions.add(this.currentQuestion.id);
    }
    const nextQuestion = this.getNextQuestion();
    this.displayQuestion(nextQuestion);
  }

  async undoLastAnswer() {
    if (this.history.length === 0) return;

    const lastEntry = this.history.pop();
    this.answeredQuestions.delete(lastEntry.question.id);
    await this.removeFromProfile(lastEntry.preference.id);

    this.addedCount--;
    this.updateProgress();

    if (this.history.length === 0) {
      document.getElementById('undoBtn').disabled = true;
    }

    this.displayQuestion(lastEntry.question);
    this.questionNumber--;
  }

  async rateQuestion(rating) {
    if (!this.currentQuestion) return;

    const questionId = this.currentQuestion.id;

    if (!this.questionFeedback[questionId]) {
      this.questionFeedback[questionId] = { up: 0, down: 0, userVote: null };
    }

    const feedback = this.questionFeedback[questionId];

    // Remove previous vote
    if (feedback.userVote === 'up') {
      feedback.up = Math.max(0, feedback.up - 1);
    } else if (feedback.userVote === 'down') {
      feedback.down = Math.max(0, feedback.down - 1);
    }

    // Add new vote
    if (rating === 'up') {
      feedback.up++;
      feedback.userVote = 'up';
      document.getElementById('thumbsUpBtn').classList.add('active');
      document.getElementById('thumbsDownBtn').classList.remove('active');
    } else if (rating === 'down') {
      feedback.down++;
      feedback.userVote = 'down';
      document.getElementById('thumbsDownBtn').classList.add('active');
      document.getElementById('thumbsUpBtn').classList.remove('active');
    }

    // Save feedback
    try {
      await chrome.storage.local.set({ questionFeedback: this.questionFeedback });
    } catch (error) {
      console.log('Could not save feedback to extension storage');
    }
  }

  updateProgress() {
    document.getElementById('progressCount').textContent = this.addedCount;
  }

  showSuccessMessage() {
    const existing = document.querySelector('.success-message');
    if (existing) existing.remove();

    const message = document.createElement('div');
    message.className = 'success-message';
    message.textContent = '✓ Preference added to your profile';
    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 2000);
  }

  exitQuiz() {
    if (this.addedCount > 0) {
      if (confirm(`You've added ${this.addedCount} preferences to your profile. Are you sure you want to exit?`)) {
        window.close();
      }
    } else {
      window.close();
    }
  }

  setupEventListeners() {
    // Answer panels
    document.getElementById('yesChoice').addEventListener('click', () => {
      this.answerQuestion('yes');
    });

    document.getElementById('noChoice').addEventListener('click', () => {
      this.answerQuestion('no');
    });

    // Skip button
    document.getElementById('skipBtn').addEventListener('click', () => {
      this.skipQuestion();
    });

    // Undo button
    document.getElementById('undoBtn').addEventListener('click', () => {
      this.undoLastAnswer();
    });

    // Feedback buttons
    document.getElementById('thumbsUpBtn').addEventListener('click', () => {
      this.rateQuestion('up');
    });

    document.getElementById('thumbsDownBtn').addEventListener('click', () => {
      this.rateQuestion('down');
    });

    // Exit button
    document.getElementById('exitBtn').addEventListener('click', () => {
      this.exitQuiz();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'y' || e.key === 'Y' || e.key === 'ArrowLeft') {
        this.answerQuestion('yes');
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') {
        this.answerQuestion('no');
      } else if (e.key === 's' || e.key === 'S') {
        this.skipQuestion();
      } else if (e.key === 'z' || e.key === 'Z') {
        if (e.metaKey || e.ctrlKey) {
          this.undoLastAnswer();
        }
      }
    });
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getContextualText(question, choice) {
    // Generate contextual text for the choice panels based on the question
    const questionText = question.question.toLowerCase();

    if (choice === 'yes') {
      if (questionText.includes('do you enjoy') || questionText.includes('do you like')) {
        return 'Yes, I do';
      } else if (questionText.includes('are you')) {
        return 'Yes, I am';
      } else if (questionText.includes('do you prefer')) {
        return 'Yes';
      } else if (questionText.includes('do you have') || questionText.includes('do you want')) {
        return 'Yes, I do';
      } else {
        return 'Yes';
      }
    } else {
      if (questionText.includes('do you enjoy') || questionText.includes('do you like')) {
        return "No, I don't";
      } else if (questionText.includes('are you')) {
        return "No, I'm not";
      } else if (questionText.includes('do you prefer')) {
        return 'No';
      } else if (questionText.includes('do you have') || questionText.includes('do you want')) {
        return "No, I don't";
      } else {
        return 'No';
      }
    }
  }
}

// Start the quiz when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new QuizPage();
});