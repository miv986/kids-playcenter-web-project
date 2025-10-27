import React, { useState, useEffect } from 'react';
import { Check, Star, Crown, Heart, Edit, Save, X } from 'lucide-react';
import { useHttp } from '../../contexts/HttpContext';
import { useAuth } from '../../contexts/AuthContext';

interface BirthdayPackage {
  id: number;
  name: string;
  type: 'ALEGRIA' | 'FIESTA' | 'ESPECIAL';
  duration: string;
  price: string;
  priceValue: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

export function PackagesAndPrices() {
  const { get, put } = useHttp();
  const { user } = useAuth();
  const [packages, setPackages] = useState<BirthdayPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<BirthdayPackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, [user?.role]);

  const fetchPackages = async () => {
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
    
    setLoading(true);
    try {
      await put(`/api/packages/${editingPackage.type}`, editingPackage);
      await fetchPackages();
      setEditingPackage(null);
    } catch (err) {
      console.error('Error guardando pack:', err);
      alert('Error al guardar el pack');
    } finally {
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

  if (loading) return null;

  return (
    <section id="precios" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Packs y Precios
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Elige el pack perfecto para tu celebración. Todos nuestros paquetes incluyen 
            diversión garantizada y momentos inolvidables para los pequeños.
          </p>
          {user?.role === 'ADMIN' && (
            <div className="mt-4 text-sm text-blue-600 font-medium">
              🔧 Modo Administrador Activo - Edita los packs haciendo clic en ellos
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pack) => {
            const IconComponent = getPackageIcon(pack.type);
            const color = getPackageColor(pack.type);
            const bgColor = getPackageBgColor(pack.type);
            const isEditing = editingPackage?.id === pack.id;

            return (
              <div
                key={pack.id}
                className={`relative p-8 bg-gradient-to-br ${!pack.isActive ? 'from-gray-100 to-gray-200 opacity-70' : bgColor} rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col ${
                  pack.isPopular && !isEditing ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''
                } ${user?.role === 'ADMIN' ? 'cursor-pointer' : ''}`}
                onClick={() => user?.role === 'ADMIN' && !isEditing && handleEdit(pack)}
              >
                {pack.isPopular && !isEditing && pack.isActive && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                      ¡Más Popular!
                    </div>
                  </div>
                )}
                
                {!pack.isActive && !isEditing && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                      Inactivo
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
                        por niño
                      </div>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Características (una por línea)</label>
                      <textarea
                        rows={6}
                        value={editingPackage.features.join('\n')}
                        onChange={(e) => setEditingPackage({ ...editingPackage, features: e.target.value.split('\n').filter(f => f.trim()) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
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
                      <label className="text-sm font-medium text-gray-700">Marcar como popular</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPackage.isActive}
                        onChange={(e) => setEditingPackage({ ...editingPackage, isActive: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label className="text-sm font-medium text-gray-700">Activo</label>
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
                          <span>Guardar</span>
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
                          <span>Cancelar</span>
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
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 mt-auto ${
                        pack.isActive 
                          ? `bg-gradient-to-r ${color} text-white hover:shadow-lg transform hover:scale-105` 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pack.isActive) {
                          const calendarSection = document.getElementById('calendario');
                          if (calendarSection) {
                            calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }
                      }}
                    >
                      {pack.isActive ? 'Reservar Ahora' : 'Pack No Disponible'}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Descuentos Especiales
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">10%</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Grupos de 10+ niños</div>
                  <div className="text-gray-600">Descuento automático</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">15%</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Reservas anticipadas</div>
                  <div className="text-gray-600">Con 2 semanas de antelación</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
