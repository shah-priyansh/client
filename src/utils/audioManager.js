// Global audio manager to handle multiple audio instances
class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.currentFeedbackId = null;
  }

  // Stop current audio and set new one
  setCurrentAudio(audio, feedbackId) {
    // Stop previous audio if it exists and is different
    if (this.currentAudio && this.currentAudio !== audio) {
      console.log('Stopping previous audio');
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    
    this.currentAudio = audio;
    this.currentFeedbackId = feedbackId;
  }

  // Stop current audio
  stopCurrentAudio() {
    if (this.currentAudio) {
      console.log('Stopping current audio');
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentFeedbackId = null;
    }
  }

  // Pause current audio (keep reference)
  pauseCurrentAudio() {
    if (this.currentAudio) {
      console.log('Pausing current audio in manager', { 
        feedbackId: this.currentFeedbackId, 
        paused: this.currentAudio.paused 
      });
      this.currentAudio.pause();
    }
  }

  // Check if audio is currently playing
  isPlaying(feedbackId) {
    return this.currentFeedbackId === feedbackId && 
           this.currentAudio && 
           !this.currentAudio.paused &&
           !this.currentAudio.ended;
  }

  // Get current playing feedback ID
  getCurrentFeedbackId() {
    return this.currentFeedbackId;
  }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager;
