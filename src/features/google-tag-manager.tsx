import Script from 'next/script'

function GTMHead() {
  if (process.env.NODE_ENV !== 'production') return null

  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-K2W3LVD2');
    `}
    </Script>
  )
}

function GTMBody() {
  if (process.env.NODE_ENV !== 'production') return null

  return (
    <noscript>
      <iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-K2W3LVD2"
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}

export { GTMBody, GTMHead }
