import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BlogPostLayout from '../components/BlogPostLayout';

const API = process.env.REACT_APP_BACKEND_URL;

const CmsBlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | notfound

  useEffect(() => {
    let active = true;
    (async () => {
      setState('loading');
      try {
        const r = await fetch(`${API}/api/blog-cms/public/posts/${slug}`);
        if (!r.ok) throw new Error('notfound');
        const d = await r.json();
        if (active) { setPost(d); setState('ok'); }
      } catch {
        if (active) setState('notfound');
      }
    })();
    return () => { active = false; };
  }, [slug]);

  if (state === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2]"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  }
  if (state === 'notfound') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF7F2] text-stone-700 gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">Artikel niet gevonden</h1>
        <Link to="/blogs" className="text-amber-700 underline">Terug naar alle blogs</Link>
      </div>
    );
  }

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return ''; }
  };

  return (
    <BlogPostLayout
      category={post.category}
      categoryColor={post.category_color}
      slug={post.slug}
      title={post.title}
      excerpt={post.meta_description || post.excerpt}
      date={fmtDate(post.created_at)}
      readMinutes={post.read_minutes}
      heroImage={post.hero_image}
      faqs={post.faqs || []}
      relatedProducts={post.related_products || []}
    >
      {post.hero_image && (
        <img src={post.hero_image} alt={post.title} className="w-full rounded-2xl mb-8 object-cover" style={{ aspectRatio: '16/9' }} loading="eager" />
      )}
      <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
    </BlogPostLayout>
  );
};

export default CmsBlogPostPage;
