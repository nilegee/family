import { describe, it, expect } from 'vitest';
import { widgetRegistry } from '../src/lib/widgetRegistry';

describe('Trivia & Scenario Widgets', () => {
  describe('Widget Registration', () => {
    it('should register unified QuizCard widget (replaces ProfileQuiz)', () => {
      const widgets = widgetRegistry.getAll();
      const quiz = widgets.find(w => w.id === 'quiz');
      
      expect(quiz).toBeDefined();
      expect(quiz?.name).toBe('Family Quiz');
      expect(quiz?.enabled).toBe(true);
      expect(typeof quiz?.component).toBe('function');
    });

    it('should register ProfileQuizCard widget as disabled (replaced by QuizCard)', () => {
      const widgets = widgetRegistry.getAll();
      const profileQuiz = widgets.find(w => w.id === 'profileQuiz');
      
      expect(profileQuiz).toBeDefined();
      expect(profileQuiz?.name).toBe('Set Your Fun Profile');
      expect(profileQuiz?.enabled).toBe(false); // Disabled because replaced by unified QuizCard
      expect(typeof profileQuiz?.component).toBe('function');
    });

    it('should register GuessFamilyCard widget as disabled (functionality merged)', () => {
      const widgets = widgetRegistry.getAll();
      const guessFamily = widgets.find(w => w.id === 'guessFamily');
      
      expect(guessFamily).toBeDefined();
      expect(guessFamily?.name).toBe('Guess Family Answers');
      expect(guessFamily?.enabled).toBe(false); // Disabled because functionality will be merged into Quiz
      expect(typeof guessFamily?.component).toBe('function');
    });

    it('should register ScenarioCard widget', () => {
      const widgets = widgetRegistry.getAll();
      const scenario = widgets.find(w => w.id === 'scenario');
      
      expect(scenario).toBeDefined();
      expect(scenario?.name).toBe('What Would You Do?');
      expect(scenario?.enabled).toBe(true);
      expect(typeof scenario?.component).toBe('function');
    });

    it('should register ScenarioDigestCard widget', () => {
      const widgets = widgetRegistry.getAll();
      const scenarioDigest = widgets.find(w => w.id === 'scenarioDigest');
      
      expect(scenarioDigest).toBeDefined();
      expect(scenarioDigest?.name).toBe('Scenario Reflection Digest');
      expect(scenarioDigest?.enabled).toBe(true);
      expect(typeof scenarioDigest?.component).toBe('function');
    });
  });

  describe('Widget Priority Order', () => {
    it('should have correct priority order for enabled widgets', () => {
      const widgets = widgetRegistry.getSorted();
      const enabledWidgetIds = ['quiz', 'scenario', 'scenarioDigest'];
      
      // Find positions of the enabled widgets
      const positions = enabledWidgetIds.map(id => 
        widgets.findIndex(w => w.id === id)
      );

      // All enabled widgets should be found
      positions.forEach(pos => {
        expect(pos).toBeGreaterThanOrEqual(0);
      });

      // Quiz should come before Scenario (higher priority)
      const quizPos = widgets.findIndex(w => w.id === 'quiz');
      const scenarioPos = widgets.findIndex(w => w.id === 'scenario');
      expect(quizPos).toBeLessThan(scenarioPos);

      // Scenario should come before ScenarioDigest (higher priority)
      const scenarioDigestPos = widgets.findIndex(w => w.id === 'scenarioDigest');
      expect(scenarioPos).toBeLessThan(scenarioDigestPos);

      // ProfileQuiz should not appear in sorted list since it's disabled
      const profileQuizPos = widgets.findIndex(w => w.id === 'profileQuiz');
      expect(profileQuizPos).toBe(-1);

      // GuessFamily should not appear in sorted list since it's disabled
      const guessFamilyPos = widgets.findIndex(w => w.id === 'guessFamily');
      expect(guessFamilyPos).toBe(-1);
    });
  });

  describe('Widget Categories', () => {
    it('should categorize interactive widgets correctly', () => {
      const interactiveWidgetIds = ['agePlayground', 'profileQuiz', 'guessFamily', 'scenario'];
      
      // These should be the widgets that would be filtered in the dashboard
      // for the Interactive category
      const widgets = widgetRegistry.getAll();
      const interactiveWidgets = widgets.filter(w => 
        interactiveWidgetIds.includes(w.id)
      );

      expect(interactiveWidgets).toHaveLength(4);
      expect(interactiveWidgets.map(w => w.id)).toEqual(
        expect.arrayContaining(interactiveWidgetIds)
      );
    });

    it('should categorize social widgets correctly', () => {
      const socialWidgetIds = ['birthday', 'wall', 'feedback', 'scenarioDigest'];
      
      // These should be the widgets that would be filtered in the dashboard
      // for the Social category
      const widgets = widgetRegistry.getAll();
      const socialWidgets = widgets.filter(w => 
        socialWidgetIds.includes(w.id)
      );

      expect(socialWidgets).toHaveLength(4);
      expect(socialWidgets.map(w => w.id)).toEqual(
        expect.arrayContaining(socialWidgetIds)
      );
    });
  });
});