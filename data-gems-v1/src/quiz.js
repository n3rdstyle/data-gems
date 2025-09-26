// Quick Quiz Feature
// Manages the yes/no quiz interface for rapid preference collection

class QuickQuiz {
  constructor() {
    this.currentQuestion = null;
    this.history = [];
    this.addedCount = 0;
    this.answeredQuestions = new Set();
    this.questionQueue = [];
    this.questionFeedback = {}; // Track thumbs up/down per question

    // Load question feedback from storage
    this.loadQuestionFeedback();

    // Initialize question bank
    this.initializeQuestions();

    // Setup event listeners
    this.setupEventListeners();
  }

  // Question Bank with templates and variations
  initializeQuestions() {
    this.questions = [
      // Food & Drink
      {
        id: 'pizza',
        question: 'Do you enjoy eating pizza?',
        category: 'Food & Drink',
        categoryIcon: '🍽️',
        yesAnswer: 'I enjoy eating pizza',
        noAnswer: "I don't enjoy pizza"
      },
      {
        id: 'coffee',
        question: 'Do you drink coffee regularly?',
        category: 'Food & Drink',
        categoryIcon: '🍽️',
        yesAnswer: 'I drink coffee regularly',
        noAnswer: "I don't drink coffee regularly"
      },
      {
        id: 'cooking',
        question: 'Do you enjoy cooking at home?',
        category: 'Food & Drink',
        categoryIcon: '🍽️',
        yesAnswer: 'I enjoy cooking at home',
        noAnswer: 'I prefer eating out or ordering food'
      },
      {
        id: 'spicy-food',
        question: 'Do you like spicy food?',
        category: 'Food & Drink',
        categoryIcon: '🍽️',
        yesAnswer: 'I enjoy spicy food',
        noAnswer: 'I prefer mild food'
      },
      {
        id: 'vegetarian',
        question: 'Are you vegetarian or vegan?',
        category: 'Food & Drink',
        categoryIcon: '🍽️',
        yesAnswer: 'I follow a vegetarian or vegan diet',
        noAnswer: 'I eat meat'
      },

      // Work & Professional
      {
        id: 'remote-work',
        question: 'Do you prefer working from home?',
        category: 'Work & Professional',
        categoryIcon: '💼',
        yesAnswer: 'I prefer working from home',
        noAnswer: 'I prefer working in an office'
      },
      {
        id: 'morning-person',
        question: 'Are you a morning person?',
        category: 'Work & Professional',
        categoryIcon: '💼',
        yesAnswer: "I'm a morning person",
        noAnswer: "I'm more productive later in the day"
      },
      {
        id: 'team-work',
        question: 'Do you enjoy working in teams?',
        category: 'Work & Professional',
        categoryIcon: '💼',
        yesAnswer: 'I enjoy collaborative team work',
        noAnswer: 'I prefer working independently'
      },
      {
        id: 'meetings',
        question: 'Do you find meetings productive?',
        category: 'Work & Professional',
        categoryIcon: '💼',
        yesAnswer: 'I find meetings productive and valuable',
        noAnswer: 'I prefer async communication over meetings'
      },

      // Hobbies
      {
        id: 'reading',
        question: 'Do you enjoy reading books?',
        category: 'Hobbies',
        categoryIcon: '🎯',
        yesAnswer: 'I enjoy reading books',
        noAnswer: "I don't read books often"
      },
      {
        id: 'gaming',
        question: 'Do you play video games?',
        category: 'Hobbies',
        categoryIcon: '🎯',
        yesAnswer: 'I enjoy playing video games',
        noAnswer: "I don't play video games"
      },
      {
        id: 'sports',
        question: 'Do you play or watch sports?',
        category: 'Hobbies',
        categoryIcon: '🎯',
        yesAnswer: 'I enjoy sports',
        noAnswer: "I'm not interested in sports"
      },
      {
        id: 'music-listener',
        question: 'Do you listen to music daily?',
        category: 'Entertainment & Media',
        categoryIcon: '🎬',
        yesAnswer: 'I listen to music daily',
        noAnswer: 'I rarely listen to music'
      },

      // Travel & Activities
      {
        id: 'travel',
        question: 'Do you enjoy traveling?',
        category: 'Travel & Activities',
        categoryIcon: '✈️',
        yesAnswer: 'I love traveling and exploring new places',
        noAnswer: 'I prefer staying close to home'
      },
      {
        id: 'beach-mountains',
        question: 'Do you prefer beaches over mountains?',
        category: 'Travel & Activities',
        categoryIcon: '✈️',
        yesAnswer: 'I prefer beach vacations',
        noAnswer: 'I prefer mountain destinations'
      },
      {
        id: 'outdoor-activities',
        question: 'Do you enjoy outdoor activities?',
        category: 'Travel & Activities',
        categoryIcon: '✈️',
        yesAnswer: 'I enjoy outdoor activities and nature',
        noAnswer: 'I prefer indoor activities'
      },

      // Lifestyle & Preferences
      {
        id: 'minimalist',
        question: 'Do you consider yourself a minimalist?',
        category: 'Lifestyle & Preferences',
        categoryIcon: '💜',
        yesAnswer: 'I embrace minimalism',
        noAnswer: 'I like having many possessions'
      },
      {
        id: 'pets',
        question: 'Do you have or want pets?',
        category: 'Lifestyle & Preferences',
        categoryIcon: '💜',
        yesAnswer: 'I love having pets',
        noAnswer: "I prefer not to have pets"
      },
      {
        id: 'exercise',
        question: 'Do you exercise regularly?',
        category: 'Lifestyle & Preferences',
        categoryIcon: '💜',
        yesAnswer: 'I exercise regularly',
        noAnswer: "I don't exercise regularly"
      },
      {
        id: 'social-media',
        question: 'Are you active on social media?',
        category: 'Technology & Communication',
        categoryIcon: '📱',
        yesAnswer: "I'm active on social media",
        noAnswer: 'I avoid or rarely use social media'
      },

      // Entertainment & Media
      {
        id: 'movies',
        question: 'Do you prefer movies over TV shows?',
        category: 'Entertainment & Media',
        categoryIcon: '🎬',
        yesAnswer: 'I prefer watching movies',
        noAnswer: 'I prefer TV shows and series'
      },
      {
        id: 'documentaries',
        question: 'Do you enjoy documentaries?',
        category: 'Entertainment & Media',
        categoryIcon: '🎬',
        yesAnswer: 'I enjoy watching documentaries',
        noAnswer: 'I prefer fiction over documentaries'
      },
      {
        id: 'podcasts',
        question: 'Do you listen to podcasts?',
        category: 'Entertainment & Media',
        categoryIcon: '🎬',
        yesAnswer: 'I regularly listen to podcasts',
        noAnswer: "I don't listen to podcasts"
      },

      // Social & Personal
      {
        id: 'introvert',
        question: 'Do you consider yourself introverted?',
        category: 'Social & Personal',
        categoryIcon: '👥',
        yesAnswer: "I'm more introverted",
        noAnswer: "I'm more extroverted"
      },
      {
        id: 'large-gatherings',
        question: 'Do you enjoy large social gatherings?',
        category: 'Social & Personal',
        categoryIcon: '👥',
        yesAnswer: 'I enjoy large social gatherings',
        noAnswer: 'I prefer small groups or one-on-one interactions'
      },
      {
        id: 'spontaneous',
        question: 'Are you spontaneous or a planner?',
        category: 'Social & Personal',
        categoryIcon: '👥',
        yesAnswer: "I'm spontaneous and flexible",
        noAnswer: 'I prefer planning things in advance'
      },

      // Technology
      {
        id: 'early-adopter',
        question: 'Are you an early adopter of new technology?',
        category: 'Technology & Communication',
        categoryIcon: '📱',
        yesAnswer: 'I love trying new technology early',
        noAnswer: 'I wait until technology is proven'
      },
      {
        id: 'ai-tools',
        question: 'Do you use AI tools regularly?',
        category: 'Technology & Communication',
        categoryIcon: '📱',
        yesAnswer: 'I regularly use AI tools',
        noAnswer: 'I rarely or never use AI tools'
      }
    ];

    // Shuffle questions initially
    this.shuffleArray(this.questions);
  }

  // Load question feedback from storage
  async loadQuestionFeedback() {
    try {
      const result = await chrome.storage.local.get(['questionFeedback']);
      this.questionFeedback = result.questionFeedback || {};
    } catch (error) {
      console.error('Failed to load question feedback:', error);
      this.questionFeedback = {};
    }
  }

  // Save question feedback to storage
  async saveQuestionFeedback() {
    try {
      await chrome.storage.local.set({ questionFeedback: this.questionFeedback });
    } catch (error) {
      console.error('Failed to save question feedback:', error);
    }
  }

  // Get next question
  getNextQuestion() {
    // Filter out questions that have been answered or have too many thumbs down
    const availableQuestions = this.questions.filter(q => {
      // Skip if already answered
      if (this.answeredQuestions.has(q.id)) return false;

      // Skip if too many thumbs down (3 or more)
      const feedback = this.questionFeedback[q.id] || { up: 0, down: 0 };
      if (feedback.down >= 3) return false;

      return true;
    });

    if (availableQuestions.length === 0) {
      // Reset if all questions have been answered
      this.answeredQuestions.clear();
      return this.getNextQuestion();
    }

    // Try to balance categories
    const categoryCounts = {};
    this.history.forEach(item => {
      categoryCounts[item.question.category] = (categoryCounts[item.question.category] || 0) + 1;
    });

    // Find least represented category
    let leastUsedCategory = null;
    let minCount = Infinity;

    availableQuestions.forEach(q => {
      const count = categoryCounts[q.category] || 0;
      if (count < minCount) {
        minCount = count;
        leastUsedCategory = q.category;
      }
    });

    // Prefer questions from least used category
    const preferredQuestions = availableQuestions.filter(q => q.category === leastUsedCategory);
    const questionPool = preferredQuestions.length > 0 ? preferredQuestions : availableQuestions;

    // Return random question from pool
    return questionPool[Math.floor(Math.random() * questionPool.length)];
  }

  // Display question
  displayQuestion(question) {
    this.currentQuestion = question;

    // Update UI
    document.getElementById('quizQuestion').textContent = question.question;
    document.getElementById('quizCategory').textContent = `${question.categoryIcon} ${question.category}`;

    // Add animation
    const container = document.querySelector('.quiz-question-container');
    container.style.animation = 'none';
    setTimeout(() => {
      container.style.animation = 'slideIn 0.3s ease';
    }, 10);

    // Reset feedback buttons
    document.getElementById('quizThumbsUp').classList.remove('selected');
    document.getElementById('quizThumbsDown').classList.remove('selected');

    // Show current feedback if exists
    const feedback = this.questionFeedback[question.id];
    if (feedback) {
      if (feedback.userVote === 'up') {
        document.getElementById('quizThumbsUp').classList.add('selected');
      } else if (feedback.userVote === 'down') {
        document.getElementById('quizThumbsDown').classList.add('selected');
      }
    }
  }

  // Answer question
  async answerQuestion(answer) {
    if (!this.currentQuestion) return;

    // Create preference item
    const preference = {
      id: Date.now().toString(),
      category: this.currentQuestion.category,
      question: this.currentQuestion.question.replace('Do you ', '').replace('Are you ', '').replace('?', ''),
      answer: answer === 'yes' ? this.currentQuestion.yesAnswer : this.currentQuestion.noAnswer,
      source: 'quick-quiz',
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to history for undo
    this.history.push({
      question: this.currentQuestion,
      answer: answer,
      preference: preference
    });

    // Mark as answered
    this.answeredQuestions.add(this.currentQuestion.id);

    // Add to profile in real-time
    await this.addToProfile(preference);

    // Update UI
    this.addedCount++;
    this.updateProgress();

    // Enable undo button
    document.getElementById('quizUndoBtn').disabled = false;

    // Get next question
    const nextQuestion = this.getNextQuestion();
    this.displayQuestion(nextQuestion);
  }

  // Skip question
  skipQuestion() {
    // Mark as answered (skipped)
    if (this.currentQuestion) {
      this.answeredQuestions.add(this.currentQuestion.id);
    }

    // Get next question
    const nextQuestion = this.getNextQuestion();
    this.displayQuestion(nextQuestion);
  }

  // Undo last answer
  async undoLastAnswer() {
    if (this.history.length === 0) return;

    // Get last entry
    const lastEntry = this.history.pop();

    // Remove from answered questions
    this.answeredQuestions.delete(lastEntry.question.id);

    // Remove from profile
    await this.removeFromProfile(lastEntry.preference.id);

    // Update count
    this.addedCount--;
    this.updateProgress();

    // Disable undo if no more history
    if (this.history.length === 0) {
      document.getElementById('quizUndoBtn').disabled = true;
    }

    // Display the question again
    this.displayQuestion(lastEntry.question);
  }

  // Add preference to profile
  async addToProfile(preference) {
    try {
      // Update the main popup's contextItems array directly if available
      if (window.addContextItem) {
        window.addContextItem(preference);
      }

      // Also save to storage for persistence
      const result = await chrome.storage.local.get(['contextItems']);
      const items = result.contextItems || [];
      items.unshift(preference); // Add to beginning of array
      await chrome.storage.local.set({ contextItems: items });

      // Show brief success animation
      this.showAddedAnimation();
    } catch (error) {
      console.error('Failed to add preference:', error);
    }
  }

  // Remove preference from profile
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

  // Rate question
  async rateQuestion(rating) {
    if (!this.currentQuestion) return;

    const questionId = this.currentQuestion.id;

    // Initialize feedback if not exists
    if (!this.questionFeedback[questionId]) {
      this.questionFeedback[questionId] = { up: 0, down: 0, userVote: null };
    }

    const feedback = this.questionFeedback[questionId];

    // Remove previous vote if exists
    if (feedback.userVote === 'up') {
      feedback.up = Math.max(0, feedback.up - 1);
    } else if (feedback.userVote === 'down') {
      feedback.down = Math.max(0, feedback.down - 1);
    }

    // Add new vote
    if (rating === 'up') {
      feedback.up++;
      feedback.userVote = 'up';
      document.getElementById('quizThumbsUp').classList.add('selected');
      document.getElementById('quizThumbsDown').classList.remove('selected');
    } else if (rating === 'down') {
      feedback.down++;
      feedback.userVote = 'down';
      document.getElementById('quizThumbsDown').classList.add('selected');
      document.getElementById('quizThumbsUp').classList.remove('selected');
    }

    // Save feedback
    await this.saveQuestionFeedback();
  }

  // Update progress display
  updateProgress() {
    document.getElementById('quizCounter').textContent = this.addedCount;

    // Update progress bar (max 20 for visual)
    const percentage = Math.min(100, (this.addedCount / 20) * 100);
    document.getElementById('quizProgressFill').style.width = `${percentage}%`;
  }

  // Show added animation
  showAddedAnimation() {
    // Could add a toast notification or visual feedback
    const progressText = document.querySelector('.progress-text');
    progressText.style.color = '#10b981';
    setTimeout(() => {
      progressText.style.color = '#6b7280';
    }, 500);
  }

  // Setup event listeners
  setupEventListeners() {
    // Yes/No buttons
    document.getElementById('quizYesBtn')?.addEventListener('click', () => {
      this.answerQuestion('yes');
    });

    document.getElementById('quizNoBtn')?.addEventListener('click', () => {
      this.answerQuestion('no');
    });

    // Skip button
    document.getElementById('quizSkipBtn')?.addEventListener('click', () => {
      this.skipQuestion();
    });

    // Undo button
    document.getElementById('quizUndoBtn')?.addEventListener('click', () => {
      this.undoLastAnswer();
    });

    // Feedback buttons
    document.getElementById('quizThumbsUp')?.addEventListener('click', () => {
      this.rateQuestion('up');
    });

    document.getElementById('quizThumbsDown')?.addEventListener('click', () => {
      this.rateQuestion('down');
    });

    // Exit button
    document.getElementById('quizExitBtn')?.addEventListener('click', () => {
      this.exitQuiz();
    });

    // Back button (currently same as undo)
    document.getElementById('quizBackBtn')?.addEventListener('click', () => {
      if (this.history.length > 0) {
        this.undoLastAnswer();
      } else {
        this.exitQuiz();
      }
    });
  }

  // Start quiz
  startQuiz() {
    // Reset state
    this.history = [];
    this.addedCount = 0;

    // Show quiz page
    document.getElementById('quickQuizPage').style.display = 'flex';
    document.querySelector('.container').style.display = 'none';

    // Display first question
    const firstQuestion = this.getNextQuestion();
    this.displayQuestion(firstQuestion);

    // Update progress
    this.updateProgress();
  }

  // Exit quiz
  exitQuiz() {
    // Hide quiz page
    document.getElementById('quickQuizPage').style.display = 'none';
    document.querySelector('.container').style.display = 'flex';

    // Since we've been updating the main array directly, just refresh the UI
    if (window.filterItems && window.updateUI) {
      window.filterItems();
      window.updateUI();
    }
  }

  // Utility: Shuffle array
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// Export for use in popup.js
window.QuickQuiz = QuickQuiz;