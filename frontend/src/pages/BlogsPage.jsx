import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, User, Clock, Mail } from 'lucide-react';
import Footer from '../components/Footer';

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
      image: "https://droomvriendjes.com/products/Sheep/Sheep_Side_product_02.png",
      featured: true
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
      image: "https://droomvriendjes.com/products/Bear/Bear_Side_product_02.png"
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
      image: "https://droomvriendjes.com/products/Panda/Panda_Side_product_02.png"
    },
    {
      id: 7,
      slug: "droomvriendjes-mondriaan-samenwerking",
      title: "Droomvriendjes.nl x Mondriaan: samen werken aan rust in de avond",
      excerpt: "In een druk gezinsleven is tot rust komen niet altijd vanzelfsprekend. Daarom werken Droomvriendjes.nl en Mondriaan samen om gezinnen te ondersteunen met praktische rustmomenten.",
      author: "Team Droomvriendjes",
      date: "19 januari 2025",
      readTime: "8 min",
      category: "Samenwerking",
      image: "https://i.imgur.com/rjvMgGO.png"
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
      image: "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=800"
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
      image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800"
    },
    {
      id: 3,
      slug: "hoogsensitiviteit-bij-kinderen",
      title: "Hoogsensitiviteit bij Kinderen: Wat Je Moet Weten",
      excerpt: "Alles over hoogsensitieve kinderen en hoe je ze kunt helpen om beter om te gaan met prikkels en emoties in het dagelijks leven.",
      author: "Emma Janssen",
      date: "28 december 2024",
      readTime: "6 min",
      category: "Opvoeding",
      image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800"
    },
    {
      id: 4,
      slug: "wetenschap-diepe-druk-stimulatie",
      title: "De Wetenschap Achter Diepe Druk Stimulatie",
      excerpt: "Ontdek hoe diepe druk stimulatie werkt en waarom het zo effectief is bij het kalmeren van kinderen en volwassenen.",
      author: "Prof. Mark Hendriksen",
      date: "20 december 2024",
      readTime: "8 min",
      category: "Wetenschap",
      image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800"
    },
    {
      id: 5,
      slug: "slaaprituals-rustgevende-routine",
      title: "Slaaprituals: Hoe Creëer Je Een Rustgevende Routine?",
      excerpt: "Een goede slaaproutine is essentieel voor kinderen. Lees onze tips voor het creëren van een effectief slaaprituaal.",
      author: "Lisa van Dam",
      date: "15 december 2024",
      readTime: "5 min",
      category: "Slaaptips",
      image: "https://images.unsplash.com/photo-1540479859555-17af45c78602?w=800"
    },
    {
      id: 6,
      slug: "adhd-slaapproblemen-tips",
      title: "ADHD en Slaapproblemen: Wat Ouders Moeten Weten",
      excerpt: "Kinderen met ADHD hebben vaak moeite met slapen. Ontdek praktische tips en oplossingen om je kind te helpen.",
      author: "Team Droomvriendjes",
      date: "10 december 2024",
      readTime: "6 min",
      category: "Opvoeding",
      image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800"
    }
  ];

  // Separate featured blog
  const featuredBlog = blogs.find(b => b.featured);
  const regularBlogs = blogs.filter(b => !b.featured);

  // Get blog link - use slug if available, otherwise use id
  const getBlogLink = (blog) => {
    if (blog.slug) {
      return `/blog/${blog.slug}`;
    }
    return `/blog/${blog.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="https://i.imgur.com/IESI44c.png" 
                alt="Droomvriendjes.nl" 
                className="h-14 sm:h-16 w-auto"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link to="/" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">Home</Link>
              <Link to="/knuffels" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">Producten</Link>
              <Link to="/blogs" className="text-purple-600 font-medium">Blog</Link>
              <Link to="/contact" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 sm:py-16">
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
              <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-purple-200 group cursor-pointer">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative h-48 sm:h-64 lg:h-auto overflow-hidden">
                    <img 
                      src={featuredBlog.image} 
                      alt={featuredBlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-4 left-4 bg-purple-600 text-white shadow-lg">
                      {featuredBlog.category}
                    </Badge>
                  </div>
                  <CardContent className="p-6 sm:p-8 flex flex-col justify-center bg-gradient-to-br from-purple-50 to-white">
                    <Badge variant="outline" className="mb-3 sm:mb-4 w-fit border-purple-200 bg-purple-100 text-purple-800">
                      Uitgelicht
                    </Badge>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-900 mb-3 sm:mb-4">
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
              <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-purple-100 group cursor-pointer h-full hover:-translate-y-1">
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <img 
                    src={blog.image} 
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-4 left-4 bg-purple-600 text-white shadow-lg text-xs">
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
                  <h3 className="text-lg sm:text-xl font-bold text-purple-900 mb-2 sm:mb-3 line-clamp-2">
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
                    <Button variant="outline" size="sm" className="text-purple-600 border-purple-600 hover:bg-purple-50 text-xs sm:text-sm whitespace-nowrap ml-2">
                      Lees Meer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 sm:py-16 rounded-2xl">
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
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <Button className="bg-white text-purple-600 hover:bg-gray-100 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base whitespace-nowrap font-medium">
                Inschrijven
              </Button>
            </div>
          </div>
        </div>

      </main>

      <Footer variant="purple" />
    </div>
  );
};

export default BlogsPage;
