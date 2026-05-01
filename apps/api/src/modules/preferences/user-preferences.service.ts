import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name);

  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        language: 'en',
        theme: 'dark',
        timezone: 'Asia/Kolkata',
        emailNotifications: true,
        pushNotifications: true,
      },
      update: {},
    });
  }

  async updatePreferences(userId: string, prefs: any) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...prefs },
      update: prefs,
    });
  }

  async setLanguage(userId: string, language: string) {
    return this.updatePreferences(userId, { language });
  }

  async setTheme(userId: string, theme: 'dark' | 'light') {
    return this.updatePreferences(userId, { theme });
  }

  async setTimezone(userId: string, timezone: string) {
    return this.updatePreferences(userId, { timezone });
  }

  async toggleEmailNotifications(userId: string, enabled: boolean) {
    return this.updatePreferences(userId, { emailNotifications: enabled });
  }

  async togglePushNotifications(userId: string, enabled: boolean) {
    return this.updatePreferences(userId, { pushNotifications: enabled });
  }

  // i18n translations - demo with English and Hindi
  getTranslations(language: string) {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'dashboard.title': 'Dashboard',
        'dashboard.welcome': 'Welcome to Profytron',
        'trading.open_trade': 'Open Trade',
        'trading.close_trade': 'Close Trade',
        'trading.take_profit': 'Take Profit',
        'trading.stop_loss': 'Stop Loss',
        'marketplace.strategies': 'Strategies',
        'marketplace.subscribe': 'Subscribe',
        'leaderboard.title': 'Leaderboard',
        'wallet.balance': 'Balance',
        'wallet.deposit': 'Deposit',
        'wallet.withdraw': 'Withdraw',
        'settings.profile': 'Profile Settings',
        'settings.language': 'Language',
        'settings.theme': 'Theme',
        'settings.notifications': 'Notifications',
      },
      hi: {
        'dashboard.title': 'डैशबोर्ड',
        'dashboard.welcome': 'Profytron में आपका स्वागत है',
        'trading.open_trade': 'ट्रेड खोलें',
        'trading.close_trade': 'ट्रेड बंद करें',
        'trading.take_profit': 'मुनाफा लें',
        'trading.stop_loss': 'नुकसान रोकें',
        'marketplace.strategies': 'रणनीतियां',
        'marketplace.subscribe': 'सदस्यता लें',
        'leaderboard.title': 'लीडरबोर्ड',
        'wallet.balance': 'शेष राशि',
        'wallet.deposit': 'जमा करें',
        'wallet.withdraw': 'निकालें',
        'settings.profile': 'प्रोफ़ाइल सेटिंग्स',
        'settings.language': 'भाषा',
        'settings.theme': 'थीम',
        'settings.notifications': 'सूचनाएं',
      },
      ar: {
        'dashboard.title': 'لوحة التحكم',
        'dashboard.welcome': 'مرحبا بكم في Profytron',
        'trading.open_trade': 'فتح صفقة',
        'trading.close_trade': 'إغلاق صفقة',
        'trading.take_profit': 'جني الأرباح',
        'trading.stop_loss': 'إيقاف الخسارة',
        'marketplace.strategies': 'الاستراتيجيات',
        'marketplace.subscribe': 'الاشتراك',
        'leaderboard.title': 'قائمة الترتيب',
        'wallet.balance': 'الرصيد',
        'wallet.deposit': 'إيداع',
        'wallet.withdraw': 'سحب',
        'settings.profile': 'إعدادات الملف الشخصي',
        'settings.language': 'اللغة',
        'settings.theme': 'المظهر',
        'settings.notifications': 'الإخطارات',
      },
      es: {
        'dashboard.title': 'Panel de Control',
        'dashboard.welcome': 'Bienvenido a Profytron',
        'trading.open_trade': 'Abrir Operación',
        'trading.close_trade': 'Cerrar Operación',
        'trading.take_profit': 'Tomar Ganancias',
        'trading.stop_loss': 'Detener Pérdida',
        'marketplace.strategies': 'Estrategias',
        'marketplace.subscribe': 'Suscribirse',
        'leaderboard.title': 'Tabla de Posiciones',
        'wallet.balance': 'Saldo',
        'wallet.deposit': 'Depositar',
        'wallet.withdraw': 'Retirar',
        'settings.profile': 'Configuración de Perfil',
        'settings.language': 'Idioma',
        'settings.theme': 'Tema',
        'settings.notifications': 'Notificaciones',
      },
    };

    return translations[language] || translations['en'];
  }

  translate(key: string, language: string) {
    const translations = this.getTranslations(language);
    return translations[key] || key;
  }
}
