import React, { useState, useEffect } from 'react';
import { Check, Star, Crown, Heart, Edit, Save, X } from 'lucide-react';
import { useHttp } from '../../contexts/HttpContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { showToast } from '../../lib/toast';
import { Spinner } from '../shared/Spinner';
import { useRouter, usePathname } from 'next/navigation';

interface BirthdayPackage {
  id: number;
  name: string;
  type: 'ALEGRIA' | 'FIESTA' | 'ESPECIAL';
  duration: string;
  price: string;
  priceValue: number;
  featuresEs: string[];
  featuresVa: string[];
  perChildTextEs?: string | null;
  perChildTextVa?: string | null;
  isPopular: boolean;
  isActive: boolean;
}

interface TranslatedPackage extends BirthdayPackage {
  features: string[];
  perChildText: string;
}

// Helper function to translate package data
function translatePackage(pack: BirthdayPackage, t: ReturnType<typeof useTranslation>['t'], locale: 'es' | 'ca'): TranslatedPackage {
  const packType = pack.type.toLowerCase() as 'alegria' | 'fiesta' | 'especial';
  const packKey = `pack${packType.charAt(0).toUpperCase() + packType.slice(1)}` as 'packAlegria' | 'packFiesta' | 'packEspecial';

  // Default names in Spanish (from seed)
  const defaultNames = {
    packAlegria: 'Pack Alegría',
    packFiesta: 'Pack Fiesta',
    packEspecial: 'Pack Especial',
  };

  // Only translate name if it matches the default Spanish name (hasn't been customized)
  // Otherwise, use the custom name from database
  const isDefaultName = pack.name === defaultNames[packKey];
  const translatedName = isDefaultName ? (t(`${packKey}.name`) || pack.name) : pack.name;

  // Get translated duration suffix
  const translatedDuration = t(`${packKey}.duration`) || '';

  // Use features based on locale (ES or VA)
  const features = locale === 'ca' ? pack.featuresVa : pack.featuresEs;

  // Use perChildText based on locale, or fallback to translation
  const perChildText = locale === 'ca' 
    ? (pack.perChildTextVa || t('perChild'))
    : (pack.perChildTextEs || t('perChild'));

  // Handle duration: extract number and use singular if 1
  let finalDuration = pack.duration;
  
  if (!pack.duration.includes('horas') && !pack.duration.includes('hores') && !pack.duration.includes('hora')) {
    // Extract number from duration (e.g., "2" from "2 horas" or just "2")
    const durationMatch = pack.duration.match(/^(\d+)/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const hourWord = hours === 1 
        ? (locale === 'ca' ? ' hora' : ' hora')
        : (locale === 'ca' ? ' hores' : ' horas');
      finalDuration = hours + hourWord;
    } else {
      finalDuration = pack.duration + translatedDuration;
    }
  } else {
    // Duration already has "horas" or "hores", check if we need to change to singular
    const durationMatch = pack.duration.match(/^(\d+)\s*(horas|hores|hora)/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      if (hours === 1) {
        finalDuration = pack.duration.replace(/(horas|hores)/, 'hora');
      }
    }
  }

  const price = pack.price.includes('€') ? pack.price : pack.price + '€';

  return {
    ...pack,
    name: translatedName,
    duration: finalDuration,
    features: features,
    price: price,
    perChildText: perChildText,
  };
}

export function PackagesAndPrices() {
  const tHook = useTranslation('Packages');
  const t = tHook.t;
  const services = useTranslation('Services');
  const tCommon = useTranslation('Common');
  const { get, put } = useHttp();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [packages, setPackages] = useState<BirthdayPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<BirthdayPackage | null>(null);
  const [loading, setLoading] = useState(true);

  // Translated packages for display (only translate when not editing)
  const translatedPackages: TranslatedPackage[] = packages.map(pack => {
    if (editingPackage?.id === pack.id) {
      // Don't translate while editing, but add features and perChildText properties
      const locale = tHook.locale;
      return {
        ...pack,
        features: locale === 'ca' ? pack.featuresVa : pack.featuresEs,
        perChildText: locale === 'ca' 
          ? (pack.perChildTextVa || t('perChild'))
          : (pack.perChildTextEs || t('perChild'))
      };
    }
    return translatePackage(pack, t, tHook.locale);
  });

  // Filter visible packages (active ones, or all for admin)
  const visiblePackages = translatedPackages.filter(p => p.isActive || user?.role === 'ADMIN');

  useEffect(() => {
    fetchPackages();
  }, [user?.role]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      // Los admins ven todos los packs (activos e inactivos), los usuarios solo los activos
      const endpoint = user?.role === 'ADMIN' ? '/api/packages/all' : '/api/packages';
      const data = await get(endpoint);
      setPackages(data);
    } catch (err) {
      console.error('Error cargando packs:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (pkg: BirthdayPackage) => {
    setEditingPackage({ ...pkg });
  };

  const handleSave = async () => {
    if (!editingPackage) return;

    try {
      await put(`/api/packages/${editingPackage.type}`, editingPackage);
      await fetchPackages();
      setEditingPackage(null);
      showToast.success(t('updateSuccess'));
    } catch (err) {
      console.error('Error guardando pack:', err);
      showToast.error(t('saveError'));
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingPackage(null);
  };

  const getPackageIcon = (type: string) => {
    switch (type) {
      case 'ALEGRIA':
        return Heart;
      case 'FIESTA':
        return Star;
      case 'ESPECIAL':
        return Crown;
      default:
        return Heart;
    }
  };

  const getPackageColor = (type: string) => {
    switch (type) {
      case 'ALEGRIA':
        return 'from-pink-400 to-purple-500';
      case 'FIESTA':
        return 'from-yellow-400 to-orange-500';
      case 'ESPECIAL':
        return 'from-green-400 to-blue-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getPackageBgColor = (type: string) => {
    switch (type) {
      case 'ALEGRIA':
        return 'from-pink-50 to-purple-50';
      case 'FIESTA':
        return 'from-yellow-50 to-orange-50';
      case 'ESPECIAL':
        return 'from-green-50 to-blue-50';
      default:
        return 'from-gray-50 to-gray-50';
    }
  };

  if (loading) {
    return (
      <section id="precios" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" text={t('loadingPackages')} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="precios" className="py-20 bg-white">
      <div className="container mx-auto px-4">

        <div className="text-center mb-16">

          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            {services.t('specialRequest')}
          </h2>


          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('description')}
          </p>
          <div className="mt-16 text-center">

            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              {t('title')}
            </h3>
          </div>
          {user?.role === 'ADMIN' && (
            <div className="mt-4 text-sm text-blue-600 font-medium">
              {tHook.t('adminMode')}
            </div>
          )}
        </div>

        <div className={`grid gap-8 max-w-6xl mx-auto ${
          visiblePackages.length === 1 
            ? 'md:grid-cols-1 justify-items-center' 
            : visiblePackages.length === 2 
            ? 'md:grid-cols-2 justify-items-center' 
            : 'md:grid-cols-3'
        }`}>
          {visiblePackages.map((pack) => {
            const IconComponent = getPackageIcon(pack.type);
            const color = getPackageColor(pack.type);
            const bgColor = getPackageBgColor(pack.type);
            const isEditing = editingPackage?.id === pack.id;

            return (
              <div
                key={pack.id}
                className={`relative p-8 bg-gradient-to-br ${!pack.isActive ? 'from-gray-100 to-gray-200 opacity-70' : bgColor} rounded-3xl shadow-soft hover:shadow-soft-lg transform hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col max-w-sm w-full ${pack.isPopular && !isEditing ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''
                  } ${user?.role === 'ADMIN' ? 'cursor-pointer' : ''} animate-fade-in`}
                style={{ animationDelay: `${pack.id * 0.1}s` }}
                onClick={() => user?.role === 'ADMIN' && !isEditing && handleEdit(pack)}
              >
                {pack.isPopular && !isEditing && pack.isActive && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                      {t('mostPopular')}
                    </div>
                  </div>
                )}

                {!pack.isActive && !isEditing && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                      {t('inactive')}
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`w-20 h-20 bg-gradient-to-br ${color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingPackage.name}
                        onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-xl"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="text"
                        value={editingPackage.duration}
                        onChange={(e) => setEditingPackage({ ...editingPackage, duration: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="text"
                        value={editingPackage.price}
                        onChange={(e) => setEditingPackage({ ...editingPackage, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-2xl"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {pack.name}
                      </h3>
                      <div className="text-gray-600 mb-4">
                        {pack.duration}
                      </div>
                      <div className="text-5xl font-bold text-gray-800 mb-2">
                        {pack.price}
                      </div>
                      <div className="text-gray-600">
                        {pack.perChildText}
                      </div>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('features')} (ES)</label>
                      <textarea
                        rows={6}
                        value={editingPackage.featuresEs.join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          setEditingPackage({ ...editingPackage, featuresEs: lines });
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('features')} (VA)</label>
                      <textarea
                        rows={6}
                        value={editingPackage.featuresVa.join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          setEditingPackage({ ...editingPackage, featuresVa: lines });
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Texto "por celebración" (ES)</label>
                      <input
                        type="text"
                        value={editingPackage.perChildTextEs || ''}
                        onChange={(e) => setEditingPackage({ ...editingPackage, perChildTextEs: e.target.value })}
                        placeholder={t('perChild')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Texto "por celebración" (VA)</label>
                      <input
                        type="text"
                        value={editingPackage.perChildTextVa || ''}
                        onChange={(e) => setEditingPackage({ ...editingPackage, perChildTextVa: e.target.value })}
                        placeholder={t('perChild')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPackage.isPopular}
                        onChange={(e) => setEditingPackage({ ...editingPackage, isPopular: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label className="text-sm font-medium text-gray-700">{t('markPopular')}</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPackage.isActive}
                        onChange={(e) => setEditingPackage({ ...editingPackage, isActive: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label className="text-sm font-medium text-gray-700">{t('markActive')}</label>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave();
                        }}
                        disabled={loading}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Save className="w-4 h-4" />
                          <span>{tCommon.t('save')}</span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel();
                        }}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <X className="w-4 h-4" />
                          <span>{tCommon.t('cancel')}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6 flex-grow">
                      {pack.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-3">
                          <div className={`w-6 h-6 bg-gradient-to-br ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      disabled={!pack.isActive}
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 mt-auto ${pack.isActive
                        ? `bg-gradient-to-r ${color} text-white hover:shadow-colored hover:shadow-lg transform hover:scale-105 active:scale-95`
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pack.isActive) {
                          // Si estamos en la página principal, hacer scroll a la sección
                          if (pathname === '/') {
                            const calendarSection = document.getElementById('calendario');
                            if (calendarSection) {
                              calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          } else {
                            // Si estamos en otra página, navegar a la página de calendario
                            router.push('/calendario');
                          }
                        }
                      }}
                    >
                      {pack.isActive ? t('bookNow') : t('packUnavailable')}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/*}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              {t('specialDiscounts')}
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">10%</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{t('groupDiscount')}</div>
                  <div className="text-gray-600">{t('groupDiscountDesc')}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">15%</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{t('earlyBooking')}</div>
                  <div className="text-gray-600">{t('earlyBookingDesc')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
*/}
      </div>
    </section>
  );
}
