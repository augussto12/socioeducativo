const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRATION, JWT_REFRESH_EXPIRATION } = require('../config/env');

class AuthService {
  /**
   * Login with username and password.
   * Returns access token and refresh token.
   */
  async login(username, password) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { team: { select: { id: true, name: true, shieldUrl: true } } },
    });

    if (!user) {
      throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Usuario desactivado. Contactá al administrador.'), { statusCode: 403 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        teamId: user.teamId,
        team: user.team,
      },
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refresh(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { team: { select: { id: true, name: true, shieldUrl: true } } },
      });

      if (!user || !user.isActive) {
        throw Object.assign(new Error('Token inválido'), { statusCode: 401 });
      }

      const accessToken = this.generateAccessToken(user);
      return {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          teamId: user.teamId,
          team: user.team,
        },
      };
    } catch (error) {
      throw Object.assign(new Error('Refresh token inválido o expirado'), { statusCode: 401 });
    }
  }

  /**
   * Change password for a user.
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw Object.assign(new Error('Contraseña actual incorrecta'), { statusCode: 400 });
    }

    if (newPassword.length < 6) {
      throw Object.assign(new Error('La nueva contraseña debe tener al menos 6 caracteres'), { statusCode: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  /**
   * Hash a password.
   */
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  generateAccessToken(user) {
    return jwt.sign(
      { userId: user.id, role: user.role, teamId: user.teamId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRATION }
    );
  }
}

module.exports = new AuthService();
