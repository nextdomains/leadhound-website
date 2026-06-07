module.exports = async function handler(req, res) {
  const body = JSON.stringify({
    calendlyUrl: process.env.CALENDLY_URL || "",
    gaId: process.env.NEXT_PUBLIC_GA_ID || "",
    gtmId: process.env.NEXT_PUBLIC_GTM_ID || "",
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || ""
  });

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300, s-maxage=300"
  });
  res.end(body);
};
