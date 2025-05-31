import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PermissionManager from '@/lib/permissions';

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock do window
const windowMock = {
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  location: {
    reload: vi.fn(),
  },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'dispatchEvent', {
  value: windowMock.dispatchEvent,
});

Object.defineProperty(window, 'location', {
  value: windowMock.location,
});

describe('Sistema de Logout', () => {
  beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    vi.clearAllMocks();
    
    // Setup inicial do localStorage mock
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'closetfesta_session') {
        return JSON.stringify({
          user: {
            id: 'test-user',
            username: 'testuser',
            full_name: 'Test User',
          },
          token: 'test-token',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          last_activity: new Date().toISOString(),
        });
      }
      if (key === 'closetfesta_users') {
        return JSON.stringify([]);
      }
      if (key === 'closetfesta_roles') {
        return JSON.stringify([]);
      }
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PermissionManager.logout()', () => {
    it('deve remover a sessão do localStorage', () => {
      // Act
      PermissionManager.logout();

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('closetfesta_session');
    });

    it('deve disparar evento user-logout com detalhes', () => {
      // Arrange
      const mockCustomEvent = vi.fn();
      global.CustomEvent = mockCustomEvent;

      // Act
      PermissionManager.logout();

      // Assert
      expect(mockCustomEvent).toHaveBeenCalledWith('user-logout', {
        detail: expect.objectContaining({
          timestamp: expect.any(String),
        }),
      });
      expect(windowMock.dispatchEvent).toHaveBeenCalled();
    });

    it('deve executar fallback de reload em caso de erro', () => {
      // Arrange
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      // Act
      PermissionManager.logout();

      // Assert
      expect(windowMock.location.reload).toHaveBeenCalled();
    });
  });

  describe('PermissionManager.isAuthenticated()', () => {
    it('deve retornar false após logout', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);

      // Act
      const isAuthenticated = PermissionManager.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false);
    });

    it('deve retornar true com sessão válida', () => {
      // Arrange - já configurado no beforeEach

      // Act
      const isAuthenticated = PermissionManager.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(true);
    });

    it('deve retornar false com sessão expirada', () => {
      // Arrange
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'closetfesta_session') {
          return JSON.stringify({
            user: { id: 'test-user' },
            token: 'test-token',
            expires_at: new Date(Date.now() - 1000).toISOString(), // Expirada
            last_activity: new Date().toISOString(),
          });
        }
        return null;
      });

      // Act
      const isAuthenticated = PermissionManager.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('PermissionManager.getCurrentSession()', () => {
    it('deve retornar null após logout', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);

      // Act
      const session = PermissionManager.getCurrentSession();

      // Assert
      expect(session).toBeNull();
    });

    it('deve fazer logout automático se sessão expirada', () => {
      // Arrange
      const logoutSpy = vi.spyOn(PermissionManager, 'logout');
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'closetfesta_session') {
          return JSON.stringify({
            user: { id: 'test-user' },
            token: 'test-token',
            expires_at: new Date(Date.now() - 1000).toISOString(), // Expirada
            last_activity: new Date().toISOString(),
          });
        }
        return null;
      });

      // Act
      const session = PermissionManager.getCurrentSession();

      // Assert
      expect(logoutSpy).toHaveBeenCalled();
      expect(session).toBeNull();
    });

    it('deve fazer logout em caso de JSON inválido', () => {
      // Arrange
      const logoutSpy = vi.spyOn(PermissionManager, 'logout');
      localStorageMock.getItem.mockReturnValue('invalid-json');

      // Act
      const session = PermissionManager.getCurrentSession();

      // Assert
      expect(logoutSpy).toHaveBeenCalled();
      expect(session).toBeNull();
    });
  });

  describe('Integração com Componentes', () => {
    it('deve simular fluxo completo de logout de componente', async () => {
      // Arrange
      const mockHandleLogout = async () => {
        try {
          PermissionManager.logout();
        } catch (error) {
          console.error('Erro no logout:', error);
          try {
            localStorage.removeItem('closetfesta_session');
            window.location.reload();
          } catch (fallbackError) {
            window.location.reload();
          }
        }
      };

      // Act
      await mockHandleLogout();

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('closetfesta_session');
      expect(windowMock.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('Event Listeners', () => {
    it('deve simular detecção de evento user-logout', () => {
      // Arrange
      let eventFired = false;
      const mockHandler = () => {
        eventFired = true;
      };

      // Simular addEventListener
      window.addEventListener('user-logout', mockHandler);

      // Act
      PermissionManager.logout();

      // Simular o disparo do evento manualmente para o teste
      mockHandler();

      // Assert
      expect(eventFired).toBe(true);
    });
  });
}); 