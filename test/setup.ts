// Test setup for Mayo app
import { vi } from 'vitest'

// Mock environment variables for tests
vi.mock('$env/dynamic/public', () => ({
        env: {
                PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
                PUBLIC_SUPABASE_ANON_KEY: 'test-key'
        }
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
	value: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
	},
        writable: true,
})
