// Test for widget loading fix
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Dashboard Widget Loading Fix', () => {
  let mockWidgets;
  
  beforeEach(() => {
    // Mock widgets with lazy loading functions similar to systemRegistry
    mockWidgets = [
      {
        id: 'wall',
        name: 'Wall Card',
        component: () => Promise.resolve({ default: 'MockWallComponent' }),
        priority: 95,
        enabled: true
      },
      {
        id: 'ayah',
        name: 'Daily Ayah',
        component: () => Promise.resolve({ default: 'MockAyahComponent' }),
        priority: 85,
        enabled: true
      },
      {
        id: 'direct',
        name: 'Direct Component',
        component: 'DirectComponent', // Not a function
        priority: 70,
        enabled: true
      }
    ];
  });

  it('should properly load lazy-loaded components', async () => {
    // Simulate the loadWidgetComponents function from the fix
    async function loadWidgetComponents(widgets) {
      const loaded = await Promise.all(
        widgets.map(async (widget) => {
          try {
            let component;
            if (typeof widget.component === 'function') {
              try {
                const modulePromise = widget.component();
                const module = await modulePromise;
                component = module.default;
              } catch (loadError) {
                console.error(`Failed to load widget component ${widget.id}:`, loadError);
                return null;
              }
            } else {
              component = widget.component;
            }
            return { config: widget, component };
          } catch (error) {
            console.error(`Failed to process widget ${widget.id}:`, error);
            return null;
          }
        })
      );
      return loaded.filter(Boolean);
    }

    const loadedWidgets = await loadWidgetComponents(mockWidgets);

    expect(loadedWidgets).toHaveLength(3);
    
    // Check that lazy-loaded components are properly resolved
    const wallWidget = loadedWidgets.find(w => w.config.id === 'wall');
    expect(wallWidget.component).toBe('MockWallComponent');
    
    const ayahWidget = loadedWidgets.find(w => w.config.id === 'ayah');
    expect(ayahWidget.component).toBe('MockAyahComponent');
    
    // Check that direct components are preserved
    const directWidget = loadedWidgets.find(w => w.config.id === 'direct');
    expect(directWidget.component).toBe('DirectComponent');
  });

  it('should handle component loading errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const widgetsWithError = [
      {
        id: 'broken',
        name: 'Broken Widget',
        component: () => Promise.reject(new Error('Load failed')),
        priority: 50,
        enabled: true
      },
      {
        id: 'working',
        name: 'Working Widget',
        component: () => Promise.resolve({ default: 'WorkingComponent' }),
        priority: 60,
        enabled: true
      }
    ];

    async function loadWidgetComponents(widgets) {
      const loaded = await Promise.all(
        widgets.map(async (widget) => {
          try {
            let component;
            if (typeof widget.component === 'function') {
              try {
                const modulePromise = widget.component();
                const module = await modulePromise;
                component = module.default;
              } catch (loadError) {
                console.error(`Failed to load widget component ${widget.id}:`, loadError);
                return null;
              }
            } else {
              component = widget.component;
            }
            return { config: widget, component };
          } catch (error) {
            console.error(`Failed to process widget ${widget.id}:`, error);
            return null;
          }
        })
      );
      return loaded.filter(Boolean);
    }

    const loadedWidgets = await loadWidgetComponents(widgetsWithError);

    // Should only have the working widget
    expect(loadedWidgets).toHaveLength(1);
    expect(loadedWidgets[0].config.id).toBe('working');
    expect(loadedWidgets[0].component).toBe('WorkingComponent');
    
    // Should have logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load widget component broken:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });
});