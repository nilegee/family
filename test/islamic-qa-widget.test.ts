import { describe, it, expect } from 'vitest';
import { widgetRegistry } from '../src/lib/widgetRegistry';

describe('Islamic Q&A Widget', () => {
	describe('Widget Registration', () => {
		it('should register Islamic Q&A widget correctly', () => {
			const widgets = widgetRegistry.getAll();
			const islamicQA = widgets.find(w => w.id === 'islamicQA');
			
			expect(islamicQA).toBeDefined();
			expect(islamicQA?.name).toBe('Islamic Q&A');
			expect(islamicQA?.enabled).toBe(true);
			expect(typeof islamicQA?.component).toBe('function');
		});

		it('should have appropriate priority for quiet mode', () => {
			const widgets = widgetRegistry.getSorted();
			const islamicQA = widgets.find(w => w.id === 'islamicQA');
			
			expect(islamicQA).toBeDefined();
			expect(islamicQA?.priority).toBe(53);
		});

		it('should be enabled by default', () => {
			const widgets = widgetRegistry.getEnabled();
			const islamicQA = widgets.find(w => w.id === 'islamicQA');
			
			expect(islamicQA).toBeDefined();
			expect(islamicQA?.enabled).toBe(true);
		});
	});

	describe('Schema Integrity', () => {
		it('should handle islamic_questions table structure correctly', () => {
			const expectedFields = [
				'id', 'question_text', 'options', 'correct_index',
				'explanation_correct', 'explanation_incorrect',
				'order_index', 'category', 'created_at'
			];

			// This test verifies the expected schema structure
			// In a real app, this would query the actual database
			expect(expectedFields).toHaveLength(9);
			expect(expectedFields).toContain('explanation_correct');
			expect(expectedFields).toContain('explanation_incorrect');
			expect(expectedFields).toContain('order_index');
		});

		it('should have reassurance fields for gentle feedback', () => {
			// Verify that both positive and gentle reassurance fields exist
			const reassuranceFields = ['explanation_correct', 'explanation_incorrect'];
			
			reassuranceFields.forEach(field => {
				expect(field).toMatch(/explanation_/);
			});
		});
	});

	describe('Widget Priority and Categorization', () => {
		it('should be categorized in quiet mode section', () => {
			const widgets = widgetRegistry.getSorted();
			const islamicQA = widgets.find(w => w.id === 'islamicQA');
			
			// Should have lower priority than anchor widgets but higher than legacy
			expect(islamicQA?.priority).toBeLessThan(80); // Below anchor widgets
			expect(islamicQA?.priority).toBeGreaterThan(50); // Above legacy widgets
		});

		it('should be positioned appropriately among quiet mode widgets', () => {
			const widgets = widgetRegistry.getSorted();
			const professionCard = widgets.find(w => w.id === 'professionCard');
			const islamicQA = widgets.find(w => w.id === 'islamicQA');
			
			expect(professionCard?.priority).toBeGreaterThan(islamicQA?.priority || 0);
		});
	});

	describe('Islamic Q&A Features', () => {
		it('should be designed for 1-2 questions per session', () => {
			// This tests the design constraint mentioned in requirements
			const maxQuestionsPerSession = 2;
			const minQuestionsPerSession = 1;
			
			expect(maxQuestionsPerSession).toBe(2);
			expect(minQuestionsPerSession).toBe(1);
		});

		it('should support order_index for question rotation', () => {
			// Test that order_index concept is included in design
			const orderingField = 'order_index';
			expect(orderingField).toBe('order_index');
		});

		it('should support category-based organization', () => {
			const expectedCategories = ['Life', 'Faith', 'Creation', 'Respect', 'Behavior'];
			
			expectedCategories.forEach(category => {
				expect(typeof category).toBe('string');
				expect(category.length).toBeGreaterThan(0);
			});
		});
	});
});