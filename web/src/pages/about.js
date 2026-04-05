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
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Rreth Nesh - FshatiBio</title>
        <meta name="description" content="Mësoni më shumë rreth FshatiBio - platforma juaj për produkte organike të freskëta nga fermerët lokalë." />
      </Head>

      <Header />

      {/* Hero Section */}
      <section className="gradient-organic relative overflow-hidden py-20 md:py-28">
        {/* Leaf decorations */}
        <div className="absolute top-8 left-8 opacity-20">
          <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
        </div>
        <div className="absolute bottom-10 right-12 opacity-15 rotate-45">
          <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
        </div>
        <div className="absolute top-1/2 right-1/4 opacity-10 -rotate-12">
          <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
        </div>

        <div className="container mx-auto px-4 max-w-7xl text-center relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
            </svg>
            <span className="text-white/90 text-sm font-medium">Historia jonë</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Rreth FshatiBio
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Platforma juaj për produkte organike të freskëta, të rritura me dashuri nga fermerët lokalë
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-7xl">

        {/* Mission Section */}
        <div className="bg-white rounded-3xl shadow-card p-8 md:p-12 mb-12 animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-forest-100 rounded-2xl mb-4">
                <svg className="w-7 h-7 text-forest-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                </svg>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-forest-900 mb-2">
                Misioni Ynë
              </h2>
              <div className="w-16 h-1 bg-honey-500 rounded-full mx-auto"></div>
            </div>
            <div className="space-y-4 text-earth-700 leading-relaxed">
              <p className="text-lg">
                Në <strong className="text-forest-700">FshatiBio</strong>, ne besojmë që çdo familje duhet të ketë qasje në produkte organike të freskëta dhe të shëndetshme. Misioni ynë është të lidhim konsumatorët me fermerët lokalë dhe të promovojmë një mënyrë jetese më të shëndetshme dhe më të qëndrueshme.
              </p>
              <p className="text-lg">
                Përmes platformës sonë, ju mund të blini produkte organike të certifikuara, të rritura pa përdorimin e pesticideve ose kimikateve, dhe të dërguara direkt nga ferma në shtëpinë tuaj.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-forest-900 mb-3">
              Pse të Zgjidhni FshatiBio?
            </h2>
            <div className="w-16 h-1 bg-honey-500 rounded-full mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-card p-6 hover:shadow-warm transition-all duration-300 transform hover:-translate-y-1 animate-fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-forest-100 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-forest-700 transition-colors">
                    <span className="group-hover:grayscale-0">{feature.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-forest-900">{feature.title}</h3>
                </div>
                <p className="text-earth-600 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="gradient-forest rounded-3xl shadow-card p-8 md:p-12 mb-12 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
            </svg>
          </div>
          <div className="text-center mb-10 relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">Numrat Tanë</h2>
            <p className="text-white/70">Bashkë kemi arritur shumë</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105 animate-bounce-soft"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="font-display text-4xl md:text-5xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-3xl shadow-card p-8 md:p-12 mb-12 animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-forest-900 mb-3">
                Vlerat Tona
              </h2>
              <div className="w-16 h-1 bg-honey-500 rounded-full mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-forest-100 rounded-2xl flex items-center justify-center text-2xl">
                    🌍
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-forest-900 mb-2">Qëndrueshmëri</h3>
                  <p className="text-earth-600 leading-relaxed text-sm">
                    Promovojmë bujqësinë e qëndrueshme dhe mbrojmë mjedisin për gjeneratat e ardhshme.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-forest-100 rounded-2xl flex items-center justify-center text-2xl">
                    🤝
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-forest-900 mb-2">Bashkëpunim</h3>
                  <p className="text-earth-600 leading-relaxed text-sm">
                    Punojmë ngushtë me fermerët lokalë për të siguruar produktet më të mira.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-forest-100 rounded-2xl flex items-center justify-center text-2xl">
                    ⭐
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-forest-900 mb-2">Cilësi</h3>
                  <p className="text-earth-600 leading-relaxed text-sm">
                    Garantojmë cilësinë e lartë të çdo produkti që ofrojmë.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-forest-100 rounded-2xl flex items-center justify-center text-2xl">
                    ❤️
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-forest-900 mb-2">Dashuri</h3>
                  <p className="text-earth-600 leading-relaxed text-sm">
                    Çdo produkt është i rritur me dashuri dhe kujdes nga fermerët tanë.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="gradient-forest rounded-3xl shadow-card p-8 md:p-12 text-white text-center animate-fade-in relative overflow-hidden">
          <div className="absolute bottom-0 left-0 opacity-10">
            <svg className="w-40 h-40 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Gati për të Filluar?</h2>
            <p className="text-xl mb-8 text-white/80">
              Eksploroni koleksionin tonë të gjerë të produkteve organike
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="group inline-flex items-center justify-center gap-2 bg-honey-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-honey-600 transition-all shadow-warm transform hover:scale-105"
              >
                <span>Shiko Produktet</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all"
              >
                <span>Kthehu në Shtëpi</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
