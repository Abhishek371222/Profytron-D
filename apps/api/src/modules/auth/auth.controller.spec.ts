import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = {
    verifyEmail: jest.fn(),
    login: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService);
  });

  it('sets the user_role cookie on email/password login', async () => {
    const dto = { email: 'admin@profytron.com', password: 'Pass123!' };
    const req = { ip: '127.0.0.1', headers: { 'user-agent': 'jest' } } as any;
    const res = { cookie: jest.fn() } as any;

    (authService.login as jest.Mock).mockResolvedValue({
      accessToken: 'access-token',
      user: { id: 'user-1', role: 'ADMIN' },
      refreshTokenForCookie: 'refresh-token',
    });

    const result = await controller.login(dto as any, req, res);

    expect(result.user.role).toBe('ADMIN');
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({ path: '/', httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'user_role',
      'ADMIN',
      expect.objectContaining({ path: '/', httpOnly: false }),
    );
  });
});
