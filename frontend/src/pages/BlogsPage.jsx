import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, User, Clock, Mail, Download, ArrowRight, Printer } from 'lucide-react';
import Footer from '../components/Footer';

const BIMG = "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/";

const BlogsPage = () => {
  const blogs = [
    {
      id: 10,
      slug: "waarom-huilt-baby-s-nachts",
      title: "Waarom huilt mijn baby 's nachts? 10 oorzaken en wat je eraan kunt doen",
      excerpt: "Je baby huilt elke nacht en je weet niet meer wat je moet doen? 10 oorzaken én praktische slaaptips waar je vanavond mee kunt beginnen.",
      author: "Team Droomvriendjes",
      date: "18 mei 2026",
      readTime: "9 min",
      category: "Babyslaap",
      image: BIMG + "waarom-huilt-baby-s-nachts.jpg",
      featured: true
    },
    {
      id: 13,
      slug: "baby-knuffel-veilig-slapen-leeftijd",
      title: "Vanaf welke leeftijd mag een baby veilig met een knuffel slapen?",
      excerpt: "Een knuffel in bed voelt vertrouwd, maar wanneer is het écht veilig? Lees de officiële richtlijnen, de risico's vóór 12 maanden en hoe je het veilig introduceert.",
      author: "Team Droomvriendjes",
      date: "28 mei 2026",
      readTime: "7 min",
      category: "Veilig slapen",
      image: BIMG + "baby-knuffel-veilig-slapen-leeftijd.jpg"
    },
    {
      id: 14,
      slug: "slaapregressie-bij-kinderen",
      title: "Slaapregressie bij baby's en peuters: herkennen en oplossen",
      excerpt: "Sliep je kind eindelijk goed en is het ineens weer onrustig? Ontdek de leeftijden waarop slaapregressie toeslaat, waarom het gebeurt en wat écht helpt.",
      author: "Team Droomvriendjes",
      date: "27 mei 2026",
      readTime: "8 min",
      category: "Babyslaap",
      image: BIMG + "slaapregressie-bij-kinderen.jpg"
    },
    {
      id: 15,
      slug: "witte-ruis-white-noise-baby",
      title: "Witte ruis voor baby's: helpt white noise écht bij slapen?",
      excerpt: "White noise is overal, maar werkt het ook? We leggen uit wat witte ruis met de babyslaap doet, hoe je het veilig gebruikt en welk volume verantwoord is.",
      author: "Team Droomvriendjes",
      date: "26 mei 2026",
      readTime: "6 min",
      category: "Wetenschap",
      image: BIMG + "witte-ruis-white-noise-baby.jpg"
    },
    {
      id: 16,
      slug: "avondroutine-kind-7-stappen",
      title: "Een rustgevende avondroutine in 7 stappen (met gratis printbaar schema)",
      excerpt: "Een vaste avondroutine is de snelste route naar beter slapen. Volg ons stappenplan van 7 stappen en download het gratis printbare slaapschema.",
      author: "Team Droomvriendjes",
      date: "25 mei 2026",
      readTime: "7 min",
      category: "Slaaptips",
      image: BIMG + "avondroutine-kind-7-stappen.jpg"
    },
    {
      id: 11,
      slug: "verschil-verzwaringsknuffel-nachtlampje",
      title: "Verzwaringsknuffel vs nachtlampje-knuffel: welke past bij jouw kind?",
      excerpt: "Beide knuffels helpen bij beter slapen, maar werken totaal anders. We leggen het verschil uit en helpen je kiezen welke past bij jouw kind.",
      author: "Team Droomvriendjes",
      date: "18 mei 2026",
      readTime: "6 min",
      category: "Productgids",
      image: BIMG + "verschil-verzwaringsknuffel-nachtlampje.jpg"
    },
    {
      id: 12,
      slug: "beste-slaapknuffel-2026",
      title: "Wat is de beste slaapknuffel voor je kind in 2026? Complete koopgids",
      excerpt: "Ouders kiezen tussen tientallen slaapknuffels. Maar welke is écht de beste? Een eerlijke koopgids met onze top 5.",
      author: "Team Droomvriendjes",
      date: "18 mei 2026",
      readTime: "8 min",
      category: "Productgids",
      image: BIMG + "beste-slaapknuffel-2026.jpg"
    },
    {
      id: 7,
      slug: "droomvriendjes-mondriaan-samenwerking",
      title: "Rust in de avond: hoe slaap bijdraagt aan mentale veerkracht bij kinderen",
      excerpt: "In een druk gezinsleven is tot rust komen niet altijd vanzelfsprekend. Praktische rustmomenten en een slaapritueel dat haalbaar blijft maken een groot verschil voor kinderen én ouders.",
      author: "Team Droomvriendjes",
      date: "19 januari 2025",
      readTime: "8 min",
      category: "Mentale rust",
      image: BIMG + "droomvriendjes-mondriaan-samenwerking.jpg"
    },
    {
      id: 1,
      slug: "5-tips-betere-nachtrust-kinderen",
      title: "5 Tips voor een Betere Nachtrust bij Kinderen",
      excerpt: "Ontdek de beste tips om je kind te helpen beter te slapen. Van een vaste slaaproutine tot het creëren van een rustige slaapomgeving.",
      author: "Team Droomvriendjes",
      date: "10 januari 2025",
      readTime: "7 min",
      category: "Slaaptips",
      image: BIMG + "5-tips-betere-nachtrust-kinderen.jpg"
    },
    {
      id: 2,
      slug: "hoe-helpen-kalmerende-knuffels-bij-stress",
      title: "Hoe Helpen Kalmerende Knuffels bij Stress?",
      excerpt: "Leer hoe onze kalmerende knuffels met licht en muziek wetenschappelijk bewezen helpen bij het verminderen van stress en angst bij kinderen.",
      author: "Dr. Sarah de Vries",
      date: "5 januari 2025",
      readTime: "7 min",
      category: "Wetenschap",
      image: BIMG + "hoe-helpen-kalmerende-knuffels-bij-stress.jpg"
    }
  ];

  // Separate featured blog; show 9 cards total (1 featured + 8 in grid)
  const featuredBlog = blogs.find(b => b.featured);
  const hardcodedRegular = blogs.filter(b => !b.featured).slice(0, 8);

  // Merge in admin-managed CMS posts (published) so they appear automatically
  const [cmsCards, setCmsCards] = useState([]);
  useEffect(() => {
    let active = true;
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog-cms/public/posts`)
      .then(r => r.ok ? r.json() : { posts: [] })
      .then(d => {
        if (!active) return;
        const cards = (d.posts || []).map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt || p.meta_description || '',
          author: p.author || 'Team Droomvriendjes',
          date: (() => { try { return new Date(p.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } })(),
          readTime: `${p.read_minutes || 6} min`,
          category: p.category,
          image: p.hero_image || `${process.env.REACT_APP_BACKEND_URL ? '' : ''}https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/5-tips-betere-nachtrust-kinderen.jpg`,
        }));
        setCmsCards(cards);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const regularBlogs = [...cmsCards, ...hardcodedRegular];

  // Get blog link - use slug if available, otherwise use id
  const getBlogLink = (blog) => {
    if (blog.slug) {
      return `/blog/${blog.slug}`;
    }
    return `/blog/${blog.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-stone-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/logo.svg" 
                alt="Droomvriendjes.nl" 
                className="h-14 sm:h-16 w-auto"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link to="/" className="text-gray-700 hover:text-amber-700 font-medium transition-colors">Home</Link>
              <Link to="/knuffels" className="text-gray-700 hover:text-amber-700 font-medium transition-colors">Producten</Link>
              <Link to="/pro" className="text-gray-700 hover:text-amber-700 font-medium transition-colors flex items-center gap-1.5">
                Printables
                <span className="text-[9px] font-bold uppercase tracking-wide bg-amber-700 text-white px-1.5 py-0.5 rounded-full leading-none">Nieuw</span>
              </Link>
              <Link to="/blogs" className="text-amber-700 font-medium">Blog</Link>
              <Link to="/contact" className="text-gray-700 hover:text-amber-700 font-medium transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-700 to-orange-700 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">Droomvriendjes Blog</h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-3xl mx-auto px-4">
            Tips, advies en verhalen over betere nachtrust, kinderslaap en welzijn
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        
        {/* Featured Blog - Mondriaan */}
        {featuredBlog && (
          <div className="mb-8 sm:mb-12">
            <Link to={getBlogLink(featuredBlog)}>
              <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-amber-200 group cursor-pointer">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative h-48 sm:h-64 lg:h-auto overflow-hidden">
                    <img 
                      src={featuredBlog.image} 
                      alt={featuredBlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-4 left-4 bg-amber-700 text-white shadow-lg">
                      {featuredBlog.category}
                    </Badge>
                  </div>
                  <CardContent className="p-6 sm:p-8 flex flex-col justify-center bg-gradient-to-br from-amber-50 to-white">
                    <Badge variant="outline" className="mb-3 sm:mb-4 w-fit border-amber-200 bg-amber-100 text-amber-800">
                      Uitgelicht
                    </Badge>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-900 mb-3 sm:mb-4">
                      {featuredBlog.title}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                      {featuredBlog.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {featuredBlog.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {featuredBlog.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {featuredBlog.readTime}
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Blog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
          {regularBlogs.map((blog) => (
            <Link key={blog.id} to={getBlogLink(blog)}>
              <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-stone-100 group cursor-pointer h-full hover:-translate-y-1">
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <img 
                    src={blog.image} 
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-4 left-4 bg-amber-700 text-white shadow-lg text-xs">
                    {blog.category}
                  </Badge>
                </div>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {blog.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {blog.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-amber-900 mb-2 sm:mb-3 line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-3">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-500 truncate flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {blog.author}
                    </span>
                    <Button variant="outline" size="sm" className="text-amber-700 border-amber-700 hover:bg-amber-50 text-xs sm:text-sm whitespace-nowrap ml-2">
                      Lees Meer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Printables Promo Banner */}
        <div className="mb-8 sm:mb-12">
          <Link to="/pro" data-testid="blogs-printables-banner" className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 text-white p-6 sm:p-10 shadow-lg">
              <div className="absolute -right-8 -top-8 opacity-10">
                <Printer className="w-40 h-40" />
              </div>
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full mb-3">
                    <Download className="w-3.5 h-3.5" />
                    Nieuw · Direct Download
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Droomvriendjes Printables</h2>
                  <p className="text-sm sm:text-base opacity-90 max-w-xl">
                    Slaapschema's, affirmatiekaartjes, kleurplaten en meer — direct als PDF in je inbox, onbeperkt te printen. Vanaf €1,95.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 bg-white text-amber-900 font-semibold px-6 py-3 rounded-full whitespace-nowrap group-hover:gap-3 transition-all">
                  Bekijk Printables
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-amber-700 to-orange-700 text-white py-12 sm:py-16 rounded-2xl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Blijf Op De Hoogte</h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90">
              Ontvang de nieuwste blogs, tips en aanbiedingen direct in je inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Je email adres"
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <Button className="bg-white text-amber-700 hover:bg-amber-50 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base whitespace-nowrap font-medium">
                Inschrijven
              </Button>
            </div>
          </div>
        </div>

      </main>

      <Footer variant="amber" />
    </div>
  );
};

export default BlogsPage;
