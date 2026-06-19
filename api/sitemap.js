export default async function handler(req, res) {
  const SUPABASE_URL = "https://incllqupwigchudjuhve.supabase.co";
  const SUPABASE_KEY = "sb_publishable_ndOmM1C9VihkZlQlnljneg_ETZkm9pB";
  const SITE_URL = "https://media.ranexgroup.my.id";

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?select=slug,updated_at,created_at&status=eq.published`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const articles = await response.json();

    const articleUrls = articles.map((article) => `
      <url>
        <loc>${SITE_URL}/detail.html?slug=${article.slug}</loc>
        <lastmod>${article.updated_at || article.created_at}</lastmod>
        <priority>0.8</priority>
      </url>
    `).join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/berita.html</loc><priority>0.9</priority></url>
  <url><loc>${SITE_URL}/kategori.html</loc><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/forum.html</loc><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/tentang.html</loc><priority>0.6</priority></url>
  <url><loc>${SITE_URL}/redaksi.html</loc><priority>0.6</priority></url>
  <url><loc>${SITE_URL}/kontak.html</loc><priority>0.6</priority></url>
  ${articleUrls}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(sitemap);
  } catch (error) {
    res.status(500).send("Sitemap error");
  }
}