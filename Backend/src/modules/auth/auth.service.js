const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../config/database');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} = require('../../config/env');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

class AuthService {
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      throw Object.assign(new Error('Credenciales invalidas'), { statusCode: 401 });
    }

    if (!user.isActive || user.deletedAt) {
      throw Object.assign(new Error('Usuario desactivado. Contacta al administrador.'), { statusCode: 403 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw Object.assign(new Error('Credenciales invalidas'), { statusCode: 401 });
    }

    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: await this.issueRefreshToken(user),
      user: this.toSessionUser(user),
    };
  }

  async refresh(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      if (!decoded.jti || !decoded.userId) {
        throw Object.assign(new Error('Token invalido'), { statusCode: 401 });
      }

      const tokenHash = hashToken(refreshToken);
      const now = new Date();

      const session = await prisma.refreshSession.findUnique({
        where: { id: decoded.jti },
        include: { user: true },
      });

      if (
        !session ||
        session.userId !== decoded.userId ||
        session.tokenHash !== tokenHash ||
        session.revokedAt ||
        session.expiresAt <= now ||
        !session.user.isActive ||
        session.user.deletedAt
      ) {
        throw Object.assign(new Error('Token invalido'), { statusCode: 401 });
      }

      const nextRefreshToken = this.generateRefreshToken(session.user);
      const nextDecoded = jwt.decode(nextRefreshToken);

      await prisma.$transaction([
        prisma.refreshSession.update({
          where: { id: session.id },
          data: { revokedAt: now },
        }),
        prisma.refreshSession.create({
          data: {
            id: nextDecoded.jti,
            userId: session.user.id,
            tokenHash: hashToken(nextRefreshToken),
            expiresAt: new Date(nextDecoded.exp * 1000),
          },
        }),
      ]);

      return {
        accessToken: this.generateAccessToken(session.user),
        refreshToken: nextRefreshToken,
        user: this.toSessionUser(session.user),
      };
    } catch (error) {
      throw Object.assign(new Error('Refresh token invalido o expirado'), { statusCode: 401 });
    }
  }

  async logout(refreshToken) {
    if (!refreshToken) return;

    const decoded = jwt.decode(refreshToken);
    if (!decoded?.jti) return;

    await prisma.refreshSession.updateMany({
      where: {
        id: decoded.jti,
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw Object.assign(new Error('Contrasena actual incorrecta'), { statusCode: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8 || !newPassword.trim()) {
      throw Object.assign(new Error('La nueva contrasena debe tener al menos 8 caracteres'), { statusCode: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10),
        mustChangePassword: false,
      },
    });

    await prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return {
      message: 'Contrasena actualizada correctamente',
      accessToken: this.generateAccessToken(updatedUser),
      refreshToken: await this.issueRefreshToken(updatedUser),
      user: this.toSessionUser(updatedUser),
    };
  }

  generateAccessToken(user) {
    return jwt.sign(
      { userId: user.id, role: user.role },
      JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        jwtid: crypto.randomUUID(),
      }
    );
  }

  async issueRefreshToken(user) {
    const refreshToken = this.generateRefreshToken(user);
    const decoded = jwt.decode(refreshToken);

    await prisma.refreshSession.create({
      data: {
        id: decoded.jti,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return refreshToken;
  }

  toSessionUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  }
}

module.exports = new AuthService();
