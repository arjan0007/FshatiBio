import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';

export default function About() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const features = [
    {
      icon: '🌱',
      title: 'Produkte 100% Organike',
      description: 'Të gjitha produktet tona janë të certifikuara organike dhe të rritura pa përdorimin e pesticideve ose kimikateve.'
    },
    {
      icon: '👨‍🌾',
      title: 'Fermerë Lokalë',
      description: 'Punojmë drejtpërdrejt me fermerët lokalë për të siguruar produktet më të freskëta dhe më cilësore.'
    },
    {
      icon: '🚚',
      title: 'Dërgesë e Shpejtë',
      description: 'Dërgojmë produktet tuaja të freskëta direkt në shtëpi me shërbim të shpejtë dhe të sigurt.'
    },
    {
      icon: '💚',
      title: 'Mjedis i Pastër',
      description: 'Promovojmë bujqësinë e qëndrueshme dhe mbrojmë mjedisin për gjeneratat e ardhshme.'
    },
    {
      icon: '⭐',
      title: 'Cilësi e Garantuar',
      description: 'Garantojmë cilësinë e çdo produkti. Nëse nuk jeni të kënaqur, kthejeni dhe ne do ta zëvendësojmë.'
    },
    {
      icon: '🤝',
      title: 'Mbështetje 24/7',
      description: 'Ekipi ynë është gjithmonë këtu për t\'ju ndihmuar me çdo pyetje ose shqetësim që mund të keni.'
    }
  ];

  const stats = [
    { value: '150+', label: 'Fermerë të Përfshirë', icon: '👨‍🌾' },
    { value: '4.9/5', label: 'Mesatarja e Vlerësimeve', icon: '⭐' },
    { value: '12K+', label: 'Porosi të Dorëzuara', icon: '📦' },
    { value: '50+', label: 'Produkte Organike', icon: '🌿' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50">
      <Head>
        <title>Rreth Nesh - FshatiBio</title>
        <meta name="description" content="Mësoni më shumë rreth FshatiBio - platforma juaj për produkte organike të freskëta nga fermerët lokalë." />
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-block mb-6">
            <span className="text-6xl md:text-8xl animate-bounce">🌱</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Rreth FshatiBio
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Platforma juaj për produkte organike të freskëta, të rritura me dashuri nga fermerët lokalë
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-12 border-2 border-green-100 animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 flex items-center justify-center gap-3">
                <span>🎯</span>
                <span>Misioni Ynë</span>
              </h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="text-lg mb-4">
                Në <strong className="text-green-600">FshatiBio</strong>, ne besojmë që çdo familje duhet të ketë qasje në produkte organike të freskëta dhe të shëndetshme. Misioni ynë është të lidhim konsumatorët me fermerët lokalë dhe të promovojmë një mënyrë jetese më të shëndetshme dhe më të qëndrueshme.
              </p>
              <p className="text-lg">
                Përmes platformës sonë, ju mund të blini produkte organike të certifikuara, të rritura pa përdorimin e pesticideve ose kimikateve, dhe të dërguara direkt nga ferma në shtëpinë tuaj.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 text-center">
            Pse të Zgjidhni FshatiBio?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-100 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl p-8 md:p-12 mb-12 text-white animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-black mb-8 text-center">Numrat Tanë</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:bg-white/20 transition-all transform hover:scale-105"
              >
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-black mb-2">{stat.value}</div>
                <div className="text-sm md:text-base text-white/90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-12 border-2 border-green-100 animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
              <span>💚</span>
              <span>Vlerat Tona</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                    🌍
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Qëndrueshmëri</h3>
                  <p className="text-gray-600">
                    Promovojmë bujqësinë e qëndrueshme dhe mbrojmë mjedisin për gjeneratat e ardhshme.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                    🤝
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Bashkëpunim</h3>
                  <p className="text-gray-600">
                    Punojmë ngushtë me fermerët lokalë për të siguruar produktet më të mira.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                    ⭐
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Cilësi</h3>
                  <p className="text-gray-600">
                    Garantojmë cilësinë e lartë të çdo produkti që ofrojmë.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                    ❤️
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Dashuri</h3>
                  <p className="text-gray-600">
                    Çdo produkt është i rritur me dashuri dhe kujdes nga fermerët tanë.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl p-8 md:p-12 text-white animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Gati për të Filluar?</h2>
          <p className="text-xl mb-8 text-white/90">
            Eksploroni koleksionin tonë të gjerë të produkteve organike
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="group inline-flex items-center justify-center gap-2 bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              <span>Shiko Produktet</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/"
              className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all transform hover:scale-105"
            >
              <span>Kthehu në Shtëpi</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

